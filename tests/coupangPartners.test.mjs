import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, test } from "node:test";
import {
  COUPANG_PARTNERS_DISCLOSURE,
  COUPANG_SEARCH_PATH,
  buildCoupangAuthorization,
  buildCoupangSearchQuery,
  clearCoupangCache,
  formatSignedDate,
  isCoupangPartnersEnabled,
  normalizeAdKeyword,
  parseCoupangSearchResponse,
  searchCoupangAds,
  sponsoredForEmptyProductSearch,
} from "@/lib/coupangPartners";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.COUPANG_PARTNERS_ACCESS_KEY;
  delete process.env.COUPANG_PARTNERS_SECRET_KEY;
  delete process.env.COUPANG_PARTNERS_SUB_ID;
  delete process.env.COUPANG_PARTNERS_MCP_SUB_ID;
  clearCoupangCache();
});

function product(overrides = {}) {
  return {
    productId: 123,
    productName: "규조토 발매트",
    productPrice: 12900,
    productImage: "https://ads-partners.coupang.com/image1/abc.jpg",
    productUrl: "https://link.coupang.com/re/AFFSDP?lptag=AF123&pageKey=123",
    isRocket: true,
    isFreeShipping: false,
    ...overrides,
  };
}

function enable() {
  process.env.COUPANG_PARTNERS_ACCESS_KEY = "access";
  process.env.COUPANG_PARTNERS_SECRET_KEY = "secret";
}

function stubFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(calls.length);
  };
  return calls;
}

test("signed date is UTC yyMMddTHHmmssZ", () => {
  assert.equal(
    formatSignedDate(new Date("2026-11-04T03:05:09.123Z")),
    "261104T030509Z",
  );
});

test("authorization signs date + method + path + query with HMAC-SHA256", () => {
  const now = new Date("2026-11-24T09:15:02Z");
  const query = buildCoupangSearchQuery("발 매트", 4, "daisofinder");
  assert.equal(
    query,
    "keyword=%EB%B0%9C%20%EB%A7%A4%ED%8A%B8&limit=4&imageSize=240x240&subId=daisofinder",
  );

  const header = buildCoupangAuthorization({
    method: "GET",
    path: COUPANG_SEARCH_PATH,
    query,
    accessKey: "access",
    secretKey: "secret",
    now,
  });
  const expected = createHmac("sha256", "secret")
    .update(`261124T091502ZGET${COUPANG_SEARCH_PATH}${query}`)
    .digest("hex");
  assert.equal(
    header,
    `CEA algorithm=HmacSHA256, access-key=access, signed-date=261124T091502Z, signature=${expected}`,
  );
});

test("keyword is trimmed, collapsed and capped", () => {
  assert.equal(normalizeAdKeyword("  발   매트 "), "발 매트");
  assert.equal(normalizeAdKeyword(null), "");
  assert.equal(normalizeAdKeyword("가".repeat(80)).length, 50);
});

test("parser keeps well-formed Coupang items only", () => {
  const ads = parseCoupangSearchResponse({
    rCode: "0",
    data: {
      productData: [
        product(),
        product({ productId: 123 }), // 중복
        product({ productId: 2, productUrl: "https://evil.example/x" }),
        product({ productId: 3, productUrl: "http://link.coupang.com/x" }),
        product({ productId: 4, productPrice: 0 }),
        product({ productId: 5, productName: "  " }),
        product({
          productId: 6,
          productImage: "https://evil.example/a.jpg",
          isRocket: "true",
        }),
      ],
    },
  });

  assert.deepEqual(ads, [
    {
      id: "123",
      name: "규조토 발매트",
      price: 12900,
      image: "https://ads-partners.coupang.com/image1/abc.jpg",
      url: "https://link.coupang.com/re/AFFSDP?lptag=AF123&pageKey=123",
      isRocket: true,
      isFreeShipping: false,
    },
    {
      id: "6",
      name: "규조토 발매트",
      price: 12900,
      image: null,
      url: "https://link.coupang.com/re/AFFSDP?lptag=AF123&pageKey=123",
      isRocket: false,
      isFreeShipping: false,
    },
  ]);
  assert.deepEqual(parseCoupangSearchResponse({ rCode: "400" }), []);
  assert.deepEqual(parseCoupangSearchResponse(null), []);
  assert.deepEqual(
    parseCoupangSearchResponse({
      rCode: "0",
      data: {
        productData: Array.from({ length: 10 }, (_, i) =>
          product({ productId: i + 1 }),
        ),
      },
    }).length,
    4,
  );
});

test("disabled without keys: no upstream call", async () => {
  const calls = stubFetch(() => {
    throw new Error("should not be called");
  });
  assert.equal(isCoupangPartnersEnabled(), false);
  assert.deepEqual(await searchCoupangAds("발매트"), []);
  assert.equal(calls.length, 0);
});

test("search signs the request and caches per keyword", async () => {
  enable();
  process.env.COUPANG_PARTNERS_SUB_ID = "web";
  const calls = stubFetch(() =>
    Response.json({ rCode: "0", data: { productData: [product()] } }),
  );

  const first = await searchCoupangAds(" 발매트 ");
  const second = await searchCoupangAds("발매트");
  assert.equal(first.length, 1);
  assert.deepEqual(second, first);
  assert.equal(calls.length, 1);

  const { url, init } = calls[0];
  assert.ok(
    url.startsWith(
      `https://api-gateway.coupang.com${COUPANG_SEARCH_PATH}?keyword=%EB%B0%9C%EB%A7%A4%ED%8A%B8&limit=4`,
    ),
  );
  assert.ok(url.endsWith("&subId=web"));
  assert.match(
    init.headers.Authorization,
    /^CEA algorithm=HmacSHA256, access-key=access, signed-date=\d{6}T\d{6}Z, signature=[0-9a-f]{64}$/,
  );
});

test("upstream failure yields an empty list instead of throwing", async () => {
  enable();
  stubFetch(() => new Response("rate limited", { status: 429 }));
  assert.deepEqual(await searchCoupangAds("발매트"), []);
});

test("disclosure is the standard Coupang Partners wording", () => {
  assert.match(COUPANG_PARTNERS_DISCLOSURE, /쿠팡 파트너스 활동의 일환으로/);
  assert.match(COUPANG_PARTNERS_DISCLOSURE, /수수료를 제공받습니다/);
});

test("MCP: sponsored block only on an empty first page, kept apart from products", async () => {
  enable();
  process.env.COUPANG_PARTNERS_SUB_ID = "web";
  process.env.COUPANG_PARTNERS_MCP_SUB_ID = "mcp";
  const calls = stubFetch(() =>
    Response.json({ rCode: "0", data: { productData: [product()] } }),
  );

  const empty = { products: [], hasMore: false, nextPage: 2 };
  const block = await sponsoredForEmptyProductSearch(empty, "발매트", 1);
  assert.equal(block.type, "advertisement");
  assert.equal(block.network, "coupang_partners");
  assert.equal(block.disclosure, COUPANG_PARTNERS_DISCLOSURE);
  assert.match(block.notice, /not Daiso stock/);
  assert.match(block.notice, /Never open, fetch or prefetch/);
  assert.deepEqual(block.items, [
    {
      name: "규조토 발매트",
      price: 12900,
      currency: "KRW",
      url: "https://link.coupang.com/re/AFFSDP?lptag=AF123&pageKey=123",
      image: "https://ads-partners.coupang.com/image1/abc.jpg",
      isRocket: true,
      isFreeShipping: false,
    },
  ]);
  // MCP 채널은 자기 subId 로 따로 부른다.
  assert.ok(calls[0].url.endsWith("&subId=mcp"));

  assert.equal(await sponsoredForEmptyProductSearch(empty, "발매트", 2), null);
  assert.equal(
    await sponsoredForEmptyProductSearch(
      { products: [{ id: "1" }], hasMore: false, nextPage: 2 },
      "발매트",
      1,
    ),
    null,
  );
  assert.equal(await sponsoredForEmptyProductSearch(null, "발매트", 1), null);

  // 웹 채널은 같은 검색어라도 subId 가 달라 캐시를 공유하지 않는다.
  await searchCoupangAds("발매트", "web");
  assert.equal(calls.length, 2);
  assert.ok(calls[1].url.endsWith("&subId=web"));
});

test("MCP: no sponsored block when ads are off", async () => {
  assert.equal(
    await sponsoredForEmptyProductSearch({ products: [] }, "발매트", 1),
    null,
  );
});
