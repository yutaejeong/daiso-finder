import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  MIN_POPULAR_VIEWS,
  buildPopularBranches,
  buildPopularProducts,
  clearPopularCache,
  fetchPopularSnapshot,
  isPopularEnabled,
  parsePopularLimit,
  parsePopularSnapshot,
} from "@/lib/popular";

const WEBHOOK_URL = "https://script.google.com/macros/s/test/exec";

function snapshot(overrides = {}) {
  return {
    generatedAt: "2026-11-07T12:00:00.000Z",
    windowDays: 30,
    branches: [
      { branchCode: "11199", views: 9 },
      { branchCode: "99999", views: 7 }, // 다이소에서 조회되지 않는 매장
      { branchCode: "10528", views: 4 },
      { branchCode: "10962", views: MIN_POPULAR_VIEWS - 1 }, // 문턱 미만
    ],
    products: [
      { branchCode: "11199", productId: "A", views: 8 },
      { branchCode: "10528", productId: "B", views: 3 },
    ],
    branchProducts: [
      { branchCode: "11199", productId: "A", views: 5 },
      { branchCode: "11199", productId: "GONE", views: 4 },
      { branchCode: "11199", productId: "C", views: 3 },
      { branchCode: "11199", productId: "D", views: 1 },
    ],
    ...overrides,
  };
}

function stubWebhook(handler) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  process.env.SEARCH_LOG_WEBHOOK_URL = WEBHOOK_URL;
  process.env.SEARCH_LOG_WEBHOOK_TOKEN = "secret";
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return handler(calls.length);
  };
  return {
    calls,
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

const fetchBranch = async (code) =>
  code === "99999"
    ? null
    : { code, name: `점${code}`, address: `주소${code}`, lat: 0, lng: 0 };

const fetchProduct = async (id) => {
  if (id === "GONE") return null;
  if (id === "BOOM") throw new Error("upstream down");
  return { id, name: `상품${id}`, price: 1000, image: null, brand: null };
};

afterEach(() => {
  delete process.env.SEARCH_LOG_WEBHOOK_URL;
  delete process.env.SEARCH_LOG_WEBHOOK_TOKEN;
  clearPopularCache();
});

test("limit is clamped and falls back to the default", () => {
  assert.equal(parsePopularLimit(null), 10);
  assert.equal(parsePopularLimit(""), 10);
  assert.equal(parsePopularLimit("abc"), 10);
  assert.equal(parsePopularLimit("0"), 1);
  assert.equal(parsePopularLimit("3.9"), 3);
  assert.equal(parsePopularLimit("500"), 20);
});

test("snapshot parsing rejects bodies the webhook should never send", () => {
  assert.equal(parsePopularSnapshot(null), null);
  assert.equal(parsePopularSnapshot({ ok: false, error: "forbidden" }), null);

  const parsed = parsePopularSnapshot({
    ok: true,
    generatedAt: "2026-11-07T12:00:00.000Z",
    windowDays: 30,
    branches: [{ branchCode: "1", views: 2 }, { views: 3 }, "junk"],
    products: [{ branchCode: "1", productId: 5, views: 2 }],
  });
  assert.deepEqual(parsed.branches, [{ branchCode: "1", views: 2 }]);
  assert.deepEqual(parsed.products, []);
  assert.deepEqual(parsed.branchProducts, []);
});

test("popular branches take their name from Daiso and skip unknown stores", async () => {
  const list = await buildPopularBranches(snapshot(), 10, { fetchBranch });

  assert.equal(list.windowDays, 30);
  assert.equal(list.updatedAt, "2026-11-07T12:00:00.000Z");
  assert.deepEqual(list.items, [
    { code: "11199", name: "점11199", address: "주소11199", views: 9 },
    { code: "10528", name: "점10528", address: "주소10528", views: 4 },
  ]);
});

test("popular branches honour the limit after dropping unknown stores", async () => {
  const list = await buildPopularBranches(snapshot(), 2, { fetchBranch });
  assert.deepEqual(
    list.items.map((item) => item.code),
    ["11199", "10528"],
  );
});

test("popular products use Daiso's name, not what the sheet recorded", async () => {
  const list = await buildPopularProducts(snapshot(), 10, "11199", {
    fetchProduct,
  });

  // GONE 은 다이소에서 조회되지 않아 빠지고, 문턱 미만(D)도 빠진다.
  assert.deepEqual(list.items, [
    {
      id: "A",
      name: "상품A",
      price: 1000,
      image: null,
      views: 5,
      branchCode: "11199",
    },
    {
      id: "C",
      name: "상품C",
      price: 1000,
      image: null,
      views: 3,
      branchCode: "11199",
    },
  ]);
});

test("overall popular products link to the store that viewed them most", async () => {
  const list = await buildPopularProducts(snapshot(), 10, undefined, {
    fetchProduct,
  });
  assert.deepEqual(
    list.items.map((item) => [item.id, item.branchCode]),
    [
      ["A", "11199"],
      ["B", "10528"],
    ],
  );
});

test("a failing product lookup drops that item instead of the whole list", async () => {
  const list = await buildPopularProducts(
    snapshot({
      branchProducts: [
        { branchCode: "11199", productId: "BOOM", views: 9 },
        { branchCode: "11199", productId: "A", views: 5 },
      ],
    }),
    10,
    "11199",
    { fetchProduct },
  );
  assert.deepEqual(
    list.items.map((item) => item.id),
    ["A"],
  );
});

test("without a snapshot the lists are empty rather than failing", async () => {
  const empty = { windowDays: null, updatedAt: null, items: [] };
  assert.deepEqual(await buildPopularBranches(null, 5, { fetchBranch }), empty);
  assert.deepEqual(
    await buildPopularProducts(null, 5, "11199", { fetchProduct }),
    empty,
  );
});

test("the webhook is asked over POST so the token stays out of the URL", async () => {
  const webhook = stubWebhook(
    () =>
      new Response(JSON.stringify({ ok: true, ...snapshot() }), {
        status: 200,
      }),
  );
  try {
    assert.equal(isPopularEnabled(), true);
    const result = await fetchPopularSnapshot("11199");

    assert.equal(result.branches.length, 4);
    assert.equal(webhook.calls.length, 1);
    assert.equal(webhook.calls[0].url, WEBHOOK_URL);
    assert.deepEqual(webhook.calls[0].body, {
      token: "secret",
      action: "popular",
      branchCode: "11199",
    });

    // 같은 매장을 곧바로 다시 물으면 웹훅을 다시 부르지 않는다.
    await fetchPopularSnapshot("11199");
    assert.equal(webhook.calls.length, 1);
  } finally {
    webhook.restore();
  }
});

test("a failing webhook yields null, or the previous snapshot when there is one", async () => {
  const originalError = console.error;
  console.error = () => {};
  let healthy = true;
  const webhook = stubWebhook(() =>
    healthy
      ? new Response(JSON.stringify({ ok: true, ...snapshot() }))
      : new Response("nope", { status: 500 }),
  );
  try {
    assert.ok(await fetchPopularSnapshot());

    healthy = false;
    // 캐시를 만료시키지 않고도 실패 경로를 타도록 다른 키로 확인한다.
    assert.equal(await fetchPopularSnapshot("10528"), null);
  } finally {
    console.error = originalError;
    webhook.restore();
  }
});

test("it stays off without a webhook url", async () => {
  assert.equal(isPopularEnabled(), false);
  assert.equal(await fetchPopularSnapshot(), null);
});

test("uncached lookups are rate limited so they cannot starve log writes", async () => {
  const originalError = console.error;
  console.error = () => {};
  const webhook = stubWebhook(
    () => new Response(JSON.stringify({ ok: true, ...snapshot() })),
  );
  try {
    for (let i = 0; i < 80; i++) {
      await fetchPopularSnapshot(`store${i}`);
    }
    assert.equal(webhook.calls.length, 60);
  } finally {
    console.error = originalError;
    webhook.restore();
  }
});
