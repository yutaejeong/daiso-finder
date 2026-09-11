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
} from "@/lib/apiError";

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
