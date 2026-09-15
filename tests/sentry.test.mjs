import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { KEYWORD_PARAM, LAT_PARAM, LNG_PARAM } from "@/lib/searchParams";
import {
  REDACTED,
  SENSITIVE_QUERY_KEYS,
  baseSentryOptions,
  getSentryEnvironment,
  getTracesSampleRate,
  isSentryEnabled,
  scrubBreadcrumb,
  scrubEvent,
  scrubQueryString,
  scrubSpan,
  scrubTransaction,
  scrubUrl,
} from "@/lib/sentry";

const DSN = "https://publickey@o0.ingest.sentry.io/1";

const SENTRY_ENV_KEYS = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE",
];

afterEach(() => {
  for (const key of SENTRY_ENV_KEYS) {
    delete process.env[key];
  }
});

test("DSN 이 없으면 리포트를 보내지 않는다", () => {
  assert.equal(isSentryEnabled(), false);
  assert.equal(baseSentryOptions().enabled, false);

  process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
  assert.equal(isSentryEnabled(), true);
  assert.equal(baseSentryOptions().dsn, DSN);
});

test("마스킹 대상에 앱이 쓰는 검색 파라미터가 모두 들어 있다", () => {
  for (const param of [KEYWORD_PARAM, LAT_PARAM, LNG_PARAM]) {
    assert.ok(
      SENSITIVE_QUERY_KEYS.includes(param),
      `${param} 가 마스킹 목록에 없다`,
    );
  }
});

test("URL 의 검색어와 좌표를 가린다", () => {
  const scrubbed = scrubUrl(
    "https://www.daiso-finder.kr/?q=%EB%AC%BC%ED%8B%B0%EC%8A%88",
  );
  assert.equal(
    scrubbed,
    `https://www.daiso-finder.kr/?q=${encodeURIComponent(REDACTED)}`,
  );

  const located = new URL(
    scrubUrl("https://www.daiso-finder.kr/?lat=37.1&lng=127.2"),
  );
  assert.equal(located.searchParams.get("lat"), REDACTED);
  assert.equal(located.searchParams.get("lng"), REDACTED);
});

test("이미지 최적화 URL 의 q 는 품질값이라 건드리지 않는다", () => {
  const url =
    "https://www.daiso-finder.kr/_next/image?url=https%3A%2F%2Fcdn.daisomall.co.kr%2Fa.jpg&w=256&q=75";
  assert.equal(scrubUrl(url), url);

  // 같은 경로라도 좌표는 여전히 가린다.
  const located = scrubUrl("/_next/image?url=%2Fa.jpg&q=75&lat=37.1");
  assert.ok(located.includes("q=75"));
  assert.ok(!located.includes("37.1"));
});

test("가릴 것이 없는 URL 은 그대로 둔다", () => {
  const url = "https://www.daiso-finder.kr/branch/11199?page=2";
  assert.equal(scrubUrl(url), url);
  assert.equal(scrubUrl("/developers"), "/developers");
});

test("해시와 나머지 파라미터는 살려 둔다", () => {
  const scrubbed = scrubUrl("/branch/11199?keyword=우산&page=2#list");
  assert.ok(scrubbed.startsWith("/branch/11199?"));
  assert.ok(scrubbed.endsWith("#list"));

  const params = new URLSearchParams(
    scrubbed.slice(scrubbed.indexOf("?") + 1, scrubbed.indexOf("#")),
  );
  assert.equal(params.get("keyword"), REDACTED);
  assert.equal(params.get("page"), "2");
});

test("쿼리 문자열 필드는 형태별로 가린다", () => {
  assert.equal(
    scrubQueryString("q=우산&page=2"),
    `q=${encodeURIComponent(REDACTED)}&page=2`,
  );
  assert.deepEqual(scrubQueryString({ q: "우산", page: "2" }), {
    q: REDACTED,
    page: "2",
  });
  assert.deepEqual(
    scrubQueryString([
      ["lat", "37.1"],
      ["page", "2"],
    ]),
    [
      ["lat", REDACTED],
      ["page", "2"],
    ],
  );
});

test("이벤트의 요청 URL 과 브레드크럼까지 가린다", () => {
  const event = scrubEvent({
    request: {
      url: "https://www.daiso-finder.kr/?q=우산",
      query_string: { q: "우산" },
    },
    breadcrumbs: [
      {
        category: "navigation",
        data: { from: "/?q=우산", to: "/branch/11199?lat=37.1" },
      },
      { category: "console", message: "안녕" },
    ],
  });

  assert.ok(!event.request.url.includes("우산"));
  assert.equal(event.request.query_string.q, REDACTED);
  assert.equal(
    event.breadcrumbs[0].data.from,
    `/?q=${encodeURIComponent(REDACTED)}`,
  );
  assert.ok(
    event.breadcrumbs[0].data.to.includes(encodeURIComponent(REDACTED)),
  );
  assert.equal(event.breadcrumbs[1].message, "안녕");
});

test("성능 트랜잭션의 요청 URL 과 스팬도 가린다", () => {
  const event = scrubTransaction({
    type: "transaction",
    transaction: "GET /api/branches/search",
    request: {
      url: "https://www.daiso-finder.kr/api/branches/search?keyword=우산",
    },
    spans: [
      {
        description: "GET /api/branches/search?keyword=우산",
        data: {
          "http.url":
            "https://www.daiso-finder.kr/api/branches/search?keyword=우산",
          "url.query": "?keyword=우산",
          "http.response.status_code": 200,
        },
      },
    ],
  });

  assert.ok(!JSON.stringify(event).includes("우산"));
  assert.equal(event.transaction, "GET /api/branches/search");
  assert.equal(event.spans[0].data["http.response.status_code"], 200);
  assert.ok(event.spans[0].data["url.query"].startsWith("?keyword="));
});

test("스팬의 쿼리 없는 값은 건드리지 않는다", () => {
  const span = scrubSpan({
    description: "GET /branch/11199",
    data: {
      "http.method": "GET",
      "http.url": "https://www.daiso-finder.kr/branch/11199",
    },
  });

  assert.equal(span.description, "GET /branch/11199");
  assert.equal(
    span.data["http.url"],
    "https://www.daiso-finder.kr/branch/11199",
  );
});

test("데이터가 없는 브레드크럼은 그대로 통과시킨다", () => {
  const breadcrumb = { category: "ui.click", message: "버튼" };
  assert.equal(scrubBreadcrumb(breadcrumb), breadcrumb);
});

test("표본 비율은 0~1 을 벗어나면 기본값으로 돌아간다", () => {
  assert.equal(getTracesSampleRate(), 0.1);

  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = "0.5";
  assert.equal(getTracesSampleRate(), 0.5);

  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = "0";
  assert.equal(getTracesSampleRate(), 0);

  for (const invalid of ["2", "-1", "많이", ""]) {
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = invalid;
    assert.equal(getTracesSampleRate(), 0.1, `"${invalid}" 처리`);
  }
});

test("환경 이름은 설정값을 먼저 쓴다", () => {
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "staging";
  assert.equal(getSentryEnvironment(), "staging");

  delete process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
  assert.ok(getSentryEnvironment().length > 0);
});

test("공통 옵션은 PII 를 끄고 마스킹 훅을 달고 나간다", () => {
  process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
  const options = baseSentryOptions();

  assert.equal(options.sendDefaultPii, false);
  assert.ok(options.ignoreErrors.length > 0);

  const sent = options.beforeSend({ request: { url: "/?q=우산" } }, {});
  assert.ok(!sent.request.url.includes("우산"));

  // 오류 이벤트와 달리 트랜잭션은 beforeSend 를 타지 않는다. 훅이 따로 걸려 있어야 한다.
  const traced = options.beforeSendTransaction(
    { type: "transaction", request: { url: "/?q=우산" } },
    {},
  );
  assert.ok(!traced.request.url.includes("우산"));
  assert.ok(
    !options
      .beforeSendSpan({ description: "GET /?q=우산" })
      .description.includes("우산"),
  );
  assert.equal(
    options.beforeBreadcrumb({ data: { url: "/?q=우산" } }).data.url,
    `/?q=${encodeURIComponent(REDACTED)}`,
  );
});
