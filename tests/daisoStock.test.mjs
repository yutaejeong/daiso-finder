import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  DAISO_DISPLAY_PATH,
  DAISO_STOCK_PATH,
  decryptPreAuthToken,
  encryptPreAuthToken,
  resetPreAuthCache,
  selStoreDisplay,
  selStoreStock,
} from "@/lib/daisoStock";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  resetPreAuthCache();
});

/** `/auth/request` 와 조회 요청을 흉내 내고, 받은 요청을 기록한다. */
function mockDaiso({ rejectFirstLookup = false } = {}) {
  const calls = [];
  let tokenCount = 0;
  let rejected = false;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ path: url.pathname, init });

    if (url.pathname === "/auth/request") {
      tokenCount += 1;
      return new Response(`jwt-${tokenCount}`, {
        headers: { "x-dm-uid": `uid-${tokenCount}` },
      });
    }

    if (rejectFirstLookup && !rejected) {
      rejected = true;
      return new Response('{"success":false,"message":"Unauthorized"}', {
        status: 403,
      });
    }

    return Response.json({ success: true, data: [] });
  };

  return calls;
}

test("pre-auth token round-trips in the CryptoJS layout", () => {
  const iv = Buffer.alloc(16, 7);
  const bearer = encryptPreAuthToken("eyJ.payload.sig", iv);

  assert.equal(bearer.slice(0, 24), iv.toString("base64"));
  assert.equal(decryptPreAuthToken(bearer), "eyJ.payload.sig");
});

test("stock and display lookups carry the encrypted token and uid", async () => {
  const calls = mockDaiso();

  await selStoreStock([{ pdNo: "1", strCd: "10700" }]);
  await selStoreDisplay({ pdNo: "1", strCd: "10700" });

  const lookups = calls.filter((call) => call.path !== "/auth/request");
  assert.deepEqual(
    lookups.map((call) => call.path),
    [DAISO_STOCK_PATH, DAISO_DISPLAY_PATH],
  );

  for (const { init } of lookups) {
    const [scheme, value] = init.headers.Authorization.split(" ");
    assert.equal(scheme, "Bearer");
    assert.equal(decryptPreAuthToken(value), "jwt-1");
    assert.equal(init.headers["X-DM-UID"], "uid-1");
  }
  assert.deepEqual(JSON.parse(lookups[0].init.body), [
    { pdNo: "1", strCd: "10700" },
  ]);
  assert.deepEqual(JSON.parse(lookups[1].init.body), {
    pdNo: "1",
    strCd: "10700",
  });
});

test("parallel lookups share one token request", async () => {
  const calls = mockDaiso();

  await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      selStoreDisplay({ pdNo: String(i), strCd: "10700" }),
    ),
  );

  assert.equal(calls.filter((c) => c.path === "/auth/request").length, 1);
});

test("a rejected token is replaced once and the lookup retried", async () => {
  const calls = mockDaiso({ rejectFirstLookup: true });

  const result = await selStoreStock([{ pdNo: "1", strCd: "10700" }]);

  assert.equal(result.success, true);
  assert.deepEqual(
    calls.map((call) => call.path),
    ["/auth/request", DAISO_STOCK_PATH, "/auth/request", DAISO_STOCK_PATH],
  );
  assert.equal(
    decryptPreAuthToken(calls[3].init.headers.Authorization.slice(7)),
    "jwt-2",
  );
});

test("a failed token request surfaces as an upstream Daiso error", async () => {
  globalThis.fetch = async () => new Response("nope", { status: 503 });

  await assert.rejects(selStoreStock([{ pdNo: "1", strCd: "10700" }]), {
    name: "DaisoApiError",
    status: 503,
  });
});
