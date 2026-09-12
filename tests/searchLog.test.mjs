import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  SEARCH_SOURCE_HEADER,
  buildSearchLogRow,
  isSearchLogEnabled,
  logSearch,
  searchLogSource,
} from "@/lib/searchLog";

const WEBHOOK_URL = "https://script.google.com/macros/s/test/exec";

function headers(values = {}) {
  return {
    get: (name) => values[name.toLowerCase()] ?? null,
  };
}

/** 웹훅 설정을 켜고, 나간 요청을 모아준다. */
function stubWebhook({ ok = true } = {}) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  process.env.SEARCH_LOG_WEBHOOK_URL = WEBHOOK_URL;
  process.env.SEARCH_LOG_WEBHOOK_TOKEN = "secret";
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response("{}", { status: ok ? 200 : 500 });
  };
  return {
    calls,
    restore() {
      globalThis.fetch = originalFetch;
      delete process.env.SEARCH_LOG_WEBHOOK_URL;
      delete process.env.SEARCH_LOG_WEBHOOK_TOKEN;
    },
  };
}

afterEach(() => {
  delete process.env.SEARCH_LOG_WEBHOOK_URL;
  delete process.env.SEARCH_LOG_WEBHOOK_TOKEN;
});

test("row carries the search term with the columns the sheet expects", () => {
  const row = buildSearchLogRow(
    {
      type: "product",
      keyword: "  물티슈  ",
      source: "web",
      branchCode: "11199",
      resultCount: 3,
    },
    new Date("2026-09-12T04:05:06.000Z"),
  );

  assert.deepEqual(row, {
    timestamp: "2026-09-12T04:05:06.000Z",
    type: "product",
    keyword: "물티슈",
    branchCode: "11199",
    resultCount: 3,
    source: "web",
    status: "ok",
  });
});

test("a search with no term (location search) produces no row", () => {
  assert.equal(
    buildSearchLogRow({ type: "branch", keyword: "   ", source: "web" }),
    null,
  );
  assert.equal(
    buildSearchLogRow({ type: "branch", keyword: "", source: "api" }),
    null,
  );
});

test("empty results are still recorded, failed searches are marked", () => {
  assert.equal(
    buildSearchLogRow({
      type: "branch",
      keyword: "강남",
      source: "web",
      resultCount: 0,
    }).resultCount,
    0,
  );

  const failed = buildSearchLogRow({
    type: "product",
    keyword: "우산",
    source: "api",
    status: "error",
  });
  assert.equal(failed.status, "error");
  assert.equal(failed.resultCount, "");
  assert.equal(failed.branchCode, "");
});

test("keywords are capped so one cell cannot blow up", () => {
  const row = buildSearchLogRow({
    type: "branch",
    keyword: "가".repeat(500),
    source: "web",
  });
  assert.equal(row.keyword.length, 200);
});

test("only the web UI header counts as a web search", () => {
  assert.equal(
    searchLogSource(headers({ [SEARCH_SOURCE_HEADER]: "web" })),
    "web",
  );
  assert.equal(
    searchLogSource(headers({ [SEARCH_SOURCE_HEADER]: " WEB " })),
    "web",
  );
  assert.equal(
    searchLogSource(headers({ [SEARCH_SOURCE_HEADER]: "curl" })),
    "api",
  );
  assert.equal(searchLogSource(headers()), "api");
});

test("collection stays off until the webhook URL is configured", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}");
  };

  try {
    assert.equal(isSearchLogEnabled(), false);
    await logSearch({ type: "branch", keyword: "강남", source: "web" });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a search posts one row with the shared token", async () => {
  const webhook = stubWebhook();

  try {
    await logSearch({
      type: "branch",
      keyword: "강남",
      source: "web",
      resultCount: 10,
    });

    assert.equal(webhook.calls.length, 1);
    const [{ url, init }] = webhook.calls;
    assert.equal(url, WEBHOOK_URL);
    assert.equal(init.method, "POST");

    const body = JSON.parse(init.body);
    assert.equal(body.token, "secret");
    assert.equal(body.rows.length, 1);
    assert.equal(body.rows[0].keyword, "강남");
    assert.equal(body.rows[0].type, "branch");
    assert.equal(body.rows[0].source, "web");
  } finally {
    webhook.restore();
  }
});

test("a failing webhook never surfaces to the caller", async () => {
  const webhook = stubWebhook({ ok: false });
  const originalError = console.error;
  console.error = () => {};

  try {
    await logSearch({ type: "product", keyword: "우산", source: "web" });
    assert.equal(webhook.calls.length, 1);
  } finally {
    console.error = originalError;
    webhook.restore();
  }
});
