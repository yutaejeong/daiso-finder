import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { checkDaisoHealth, HEALTH_BRANCH_CODE } from "@/lib/daisoHealth";
import { resetPreAuthCache } from "@/lib/daisoStock";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  resetPreAuthCache();
});

const ok = (data) => Response.json({ success: true, data });

/** 경로별 응답을 바꿔 끼울 수 있는 다이소 흉내. */
function mockDaiso(overrides = {}) {
  const calls = [];
  const routes = {
    "/pdo/pdThumbSelSimple": () => ok([{ pdNo: "1" }, { pdNo: "2" }]),
    "/auth/request": () =>
      new Response("jwt", { headers: { "x-dm-uid": "uid" } }),
    "/pd/pdh/selStrPkupStck": () => ok([]),
    "/pdo/selIntPdStDispInfo": () => ok([]),
    ...overrides,
  };

  globalThis.fetch = async (input, init = {}) => {
    const { pathname } = new URL(String(input));
    calls.push({ pathname, body: init.body });
    return routes[pathname]();
  };

  return calls;
}

test("healthy when every step answers, even with zero stock", async () => {
  const calls = mockDaiso();

  const result = await checkDaisoHealth();

  assert.equal(result.ok, true);
  assert.deepEqual(result.checks, {
    search: "ok",
    stock: "ok",
    display: "ok",
  });
  const stock = calls.find((c) => c.pathname === "/pd/pdh/selStrPkupStck");
  assert.deepEqual(JSON.parse(stock.body), [
    { pdNo: "1", strCd: HEALTH_BRANCH_CODE },
    { pdNo: "2", strCd: HEALTH_BRANCH_CODE },
  ]);
});

test("names the step that broke and the upstream status", async () => {
  mockDaiso({
    "/pd/pdh/selStrPkupStck": () =>
      new Response('{"status":500}', { status: 500 }),
  });

  const result = await checkDaisoHealth();

  assert.equal(result.ok, false);
  assert.equal(result.failedStep, "stock");
  assert.equal(result.upstreamStatus, 500);
});

test("a changed response shape counts as a failure", async () => {
  mockDaiso({
    "/pdo/selIntPdStDispInfo": () =>
      Response.json({ success: false, message: "Unauthorized" }),
  });

  const result = await checkDaisoHealth();

  assert.equal(result.ok, false);
  assert.equal(result.failedStep, "display");
  assert.equal(result.upstreamStatus, null);
  assert.match(result.reason, /Unauthorized/);
});

test("an empty search result is a failure, not a silent pass", async () => {
  mockDaiso({ "/pdo/pdThumbSelSimple": () => ok([]) });

  const result = await checkDaisoHealth();

  assert.equal(result.ok, false);
  assert.equal(result.failedStep, "search");
});
