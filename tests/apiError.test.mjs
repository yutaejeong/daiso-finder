import assert from "node:assert/strict";
import { test } from "node:test";
import {
  API_ERROR_CODES,
  buildApiErrorBody,
  internalError,
  methodNotAllowed,
  missingParameter,
  notFound,
  upstreamError,
  UPSTREAM_ERROR_NAMES,
  upstreamErrorOrNull,
} from "@/lib/apiError";
import { DaisoApiError } from "@/lib/daisoApiClient";
import { DaisoBranchApiError } from "@/lib/daisoBranches";
import { capturedExceptions } from "./sentryStub.mjs";

const REQUIRED_FIELDS = [
  "error",
  "code",
  "message",
  "hint",
  "status",
  "documentation",
];

async function bodyOf(response) {
  return JSON.parse(await response.text());
}

test("error bodies always carry the agent-readable fields", () => {
  const body = buildApiErrorBody({
    status: 400,
    code: "missing_parameter",
    error: "검색어를 입력해주세요.",
    message: "The `keyword` query parameter is required.",
    hint: "Retry with ?keyword=강남.",
  });

  for (const field of REQUIRED_FIELDS) {
    assert.ok(field in body, `missing ${field}`);
  }
  assert.ok(API_ERROR_CODES.includes(body.code));
  assert.match(body.documentation, /^https?:\/\/.+\/developers$/);
  assert.equal("detail" in body, false);
});

test("missingParameter and notFound use JSON content type and no-store", async () => {
  for (const response of [
    missingParameter("a", "b", "c"),
    notFound("a", "b", "c"),
  ]) {
    assert.equal(
      response.headers.get("content-type"),
      "application/json; charset=utf-8",
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await bodyOf(response);
    assert.equal(body.status, response.status);
  }
});

test("upstream 4xx is passed through and 5xx becomes 502", async () => {
  const notFoundUpstream = upstreamError("실패", 404, "detail", "hint");
  assert.equal(notFoundUpstream.status, 404);

  const serverUpstream = upstreamError("실패", 503, "detail", "hint");
  assert.equal(serverUpstream.status, 502);

  const body = await bodyOf(serverUpstream);
  assert.equal(body.code, "upstream_error");
  assert.equal(body.detail, "detail");
  assert.match(body.message, /HTTP 503/);
});

test("internalError keeps the exception message in detail", async () => {
  const response = internalError(new Error("boom"), "retry later");
  assert.equal(response.status, 500);

  const body = await bodyOf(response);
  assert.equal(body.code, "internal_error");
  assert.equal(body.detail, "boom");
  assert.equal(body.hint, "retry later");
});

test("internalError reports to Sentry, upstreamError does not", () => {
  capturedExceptions.length = 0;

  upstreamError("실패", 503, "detail", "hint");
  assert.equal(capturedExceptions.length, 0);

  const error = new Error("boom");
  internalError(error, "retry later");

  assert.equal(capturedExceptions.length, 1);
  assert.equal(capturedExceptions[0].error, error);
  assert.equal(
    capturedExceptions[0].context.tags.api_error_code,
    "internal_error",
  );
});

test("upstreamErrorOrNull recognises every upstream error class", async () => {
  // 클래스 이름으로 판별하므로, 클래스가 이름을 바꾸면 여기서 먼저 깨져야 한다.
  const errors = [
    new DaisoApiError("상품 조회 실패", 503, "detail"),
    new DaisoBranchApiError("매장 조회 실패", 404, "detail"),
  ];

  for (const error of errors) {
    assert.ok(
      UPSTREAM_ERROR_NAMES.includes(error.name),
      `${error.name} 가 목록에 없다`,
    );

    const response = upstreamErrorOrNull(error, "retry");
    assert.ok(response, `${error.name} 를 상류 오류로 보지 못했다`);

    const body = await bodyOf(response);
    assert.equal(body.code, "upstream_error");
    assert.equal(body.error, error.message);
    assert.equal(body.detail, "detail");
  }

  // 5xx 는 게이트웨이 오류로, 4xx 는 그대로 전달한다.
  assert.equal(upstreamErrorOrNull(errors[0], "retry").status, 502);
  assert.equal(upstreamErrorOrNull(errors[1], "retry").status, 404);
});

test("upstreamErrorOrNull lets other errors fall through to internalError", () => {
  assert.equal(upstreamErrorOrNull(new Error("boom"), "retry"), null);
  assert.equal(upstreamErrorOrNull("문자열", "retry"), null);
  assert.equal(upstreamErrorOrNull(undefined, "retry"), null);

  // 이름만 흉내 내고 status/detail 이 없으면 상류 오류로 보지 않는다.
  const impostor = new Error("가짜");
  impostor.name = "DaisoApiError";
  assert.equal(upstreamErrorOrNull(impostor, "retry"), null);
});

test("upstreamErrorOrNull can override the Korean message", async () => {
  const response = upstreamErrorOrNull(
    new DaisoApiError("원본 메시지", 503, "detail"),
    "retry",
    "매장 검색 중 오류가 발생했습니다.",
  );

  assert.equal(
    (await bodyOf(response)).error,
    "매장 검색 중 오류가 발생했습니다.",
  );
});

test("methodNotAllowed returns the shared JSON shape and Allow header", async () => {
  const response = methodNotAllowed(
    new Request("https://daiso-finder.kr/api/products", { method: "POST" }),
    ["GET", "HEAD", "OPTIONS"],
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD, OPTIONS");
  const body = await bodyOf(response);
  assert.equal(body.code, "method_not_allowed");
  assert.match(body.message, /POST.*\/api\/products/);
});
