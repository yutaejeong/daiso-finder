import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  CONSOLE_LOG_NAME,
  SEARCH_SOURCE_HEADER,
  buildSearchLogRow,
  buildViewLogRow,
  isConsoleLogEnabled,
  isSearchLogEnabled,
  logSearch,
  logView,
  parseViewLogEntry,
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

/** console.log 로 나간 줄을 모아준다. */
function captureConsole() {
  const lines = [];
  const originalLog = console.log;
  console.log = (line) => lines.push(line);
  return {
    lines,
    restore() {
      console.log = originalLog;
    },
  };
}

afterEach(() => {
  delete process.env.SEARCH_LOG_WEBHOOK_URL;
  delete process.env.SEARCH_LOG_WEBHOOK_TOKEN;
  delete process.env.SEARCH_LOG_CONSOLE;
  delete process.env.VERCEL;
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
    productId: "",
    productName: "",
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

test("view bodies are validated before anything is recorded", () => {
  assert.deepEqual(
    parseViewLogEntry({ type: "branch_view", branchCode: " 11199 " }),
    { type: "branch_view", branchCode: "11199" },
  );
  assert.deepEqual(
    parseViewLogEntry({
      type: "product_view",
      branchCode: "11199",
      productId: "1019373",
      productName: "물티슈",
    }),
    {
      type: "product_view",
      branchCode: "11199",
      productId: "1019373",
      productName: "물티슈",
    },
  );

  for (const body of [
    null,
    "branch_view",
    {},
    { type: "branch_view" },
    { type: "branch", branchCode: "11199" },
    { type: "branch_view", branchCode: "11199; DROP" },
    { type: "branch_view", branchCode: "1".repeat(33) },
    { type: "product_view", branchCode: "11199" },
    { type: "product_view", branchCode: "11199", productId: 1019373 },
  ]) {
    assert.equal(parseViewLogEntry(body), null, JSON.stringify(body));
  }
});

test("view rows fill the product columns and leave the search ones empty", () => {
  const row = buildViewLogRow(
    {
      type: "product_view",
      branchCode: "11199",
      productId: "1019373",
      productName: "가".repeat(500),
    },
    new Date("2026-10-17T01:02:03.000Z"),
  );

  assert.equal(row.timestamp, "2026-10-17T01:02:03.000Z");
  assert.equal(row.type, "product_view");
  assert.equal(row.keyword, "");
  assert.equal(row.branchCode, "11199");
  assert.equal(row.resultCount, "");
  assert.equal(row.source, "web");
  assert.equal(row.status, "ok");
  assert.equal(row.productId, "1019373");
  assert.equal(row.productName.length, 200);

  const branchRow = buildViewLogRow({
    type: "branch_view",
    branchCode: "11199",
  });
  assert.equal(branchRow.productId, "");
  assert.equal(branchRow.productName, "");
});

test("a view posts one row through the same webhook", async () => {
  const webhook = stubWebhook();

  try {
    await logView({ type: "branch_view", branchCode: "11199" });

    assert.equal(webhook.calls.length, 1);
    const body = JSON.parse(webhook.calls[0].init.body);
    assert.equal(body.rows[0].type, "branch_view");
    assert.equal(body.rows[0].branchCode, "11199");
    assert.equal(body.rows[0].keyword, "");
  } finally {
    webhook.restore();
  }
});

test("runtime log lines are on for Vercel and can be toggled by env", () => {
  assert.equal(isConsoleLogEnabled(), false);

  process.env.VERCEL = "1";
  assert.equal(isConsoleLogEnabled(), true);

  process.env.SEARCH_LOG_CONSOLE = "0";
  assert.equal(isConsoleLogEnabled(), false);

  delete process.env.VERCEL;
  process.env.SEARCH_LOG_CONSOLE = "true";
  assert.equal(isConsoleLogEnabled(), true);
});

test("each row is written as one JSON line, even without the webhook", async () => {
  process.env.SEARCH_LOG_CONSOLE = "1";
  const output = captureConsole();

  try {
    await logSearch({ type: "product", keyword: "우산", source: "api" });
    await logView({
      type: "product_view",
      branchCode: "11199",
      productId: "1019373",
    });
    // 검색어가 없는 위치 검색은 어디에도 남지 않는다.
    await logSearch({ type: "branch", keyword: "", source: "web" });
  } finally {
    output.restore();
  }

  assert.equal(output.lines.length, 2);
  const [search, view] = output.lines.map((line) => JSON.parse(line));
  assert.equal(search.log, CONSOLE_LOG_NAME);
  assert.equal(search.type, "product");
  assert.equal(search.keyword, "우산");
  assert.equal(view.log, CONSOLE_LOG_NAME);
  assert.equal(view.type, "product_view");
  assert.equal(view.productId, "1019373");
});

test("runtime log lines stay off locally by default", async () => {
  const output = captureConsole();

  try {
    await logView({ type: "branch_view", branchCode: "11199" });
  } finally {
    output.restore();
  }

  assert.equal(output.lines.length, 0);
});
