import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apiRoot,
  buildUrl,
  DEFAULT_BASE_URL,
  parseArgs,
  UsageError,
} from "../cli/src/args.mjs";
import {
  formatApiError,
  formatAvailability,
  formatProducts,
  formatStores,
} from "../cli/src/format.mjs";
import { run } from "../cli/src/index.mjs";

test("parses a command with positional arguments", () => {
  const parsed = parseArgs(["products", "11199", "수세미"]);
  assert.equal(parsed.command, "products");
  assert.deepEqual(parsed.args, ["11199", "수세미"]);
  assert.equal(parsed.options.baseUrl, DEFAULT_BASE_URL);
  assert.equal(parsed.options.json, false);
});

test("parses boolean and valued flags in any position", () => {
  const parsed = parseArgs([
    "--json",
    "stores",
    "강남",
    "--page",
    "3",
    "--base-url",
    "https://example.test/",
  ]);

  assert.equal(parsed.command, "stores");
  assert.deepEqual(parsed.args, ["강남"]);
  assert.equal(parsed.options.json, true);
  assert.equal(parsed.options.page, 3);
  assert.equal(parsed.options.baseUrl, "https://example.test");
});

test("rejects unknown flags and bad values instead of ignoring them", () => {
  assert.throws(() => parseArgs(["stores", "--nope"]), UsageError);
  assert.throws(() => parseArgs(["stores", "--page"]), UsageError);
  assert.throws(() => parseArgs(["stores", "--page", "0"]), UsageError);
  assert.throws(() => parseArgs(["stores", "--page", "two"]), UsageError);
});

test("--sandbox routes every request to the fixture endpoints", () => {
  const live = parseArgs(["stores", "강남"]).options;
  const sandbox = parseArgs(["stores", "강남", "--sandbox"]).options;

  assert.equal(apiRoot(live), `${DEFAULT_BASE_URL}/api`);
  assert.equal(apiRoot(sandbox), `${DEFAULT_BASE_URL}/api/sandbox`);
  assert.equal(
    buildUrl("/branches/search", sandbox, { keyword: "강남" }).pathname,
    "/api/sandbox/branches/search",
  );
});

test("buildUrl drops empty query values", () => {
  const options = parseArgs(["stores", "강남"]).options;
  const url = buildUrl("/branches/search", options, {
    keyword: "강남",
    curLttd: undefined,
    curLitd: "",
    currentPage: 2,
  });

  assert.equal(url.searchParams.get("keyword"), "강남");
  assert.equal(url.searchParams.has("curLttd"), false);
  assert.equal(url.searchParams.has("curLitd"), false);
  assert.equal(url.searchParams.get("currentPage"), "2");
});

test("formats stores, products and availability for humans", () => {
  const stores = formatStores([
    {
      code: "11199",
      name: "강남역점",
      address: "서울특별시 강남구 강남대로 422",
      openTime: "10:00",
      closeTime: "22:00",
      lat: 37.497175,
      lng: 127.027926,
    },
  ]);
  assert.match(stores, /11199/);
  assert.match(stores, /영업 10:00–22:00/);
  assert.match(formatStores([]), /찾지 못했습니다/);

  const products = formatProducts({
    products: [
      {
        id: "1019373",
        name: "다용도 수세미 3입",
        price: 1000,
        stock: 12,
        stairNo: 1,
        zoneNo: 4,
      },
    ],
    hasMore: true,
    nextPage: 2,
  });
  assert.match(products, /1,000원/);
  assert.match(products, /재고 12개/);
  assert.match(products, /--page 2/);

  const availability = formatAvailability({
    stock: 3,
    stairNo: null,
    zoneNo: null,
    otherBranches: [
      { code: "10528", name: "명동본점", stock: 5, distanceKm: 1.2 },
    ],
  });
  assert.match(availability, /진열 위치 정보 없음/);
  assert.match(availability, /명동본점 \(1\.2km\)/);
});

test("API error bodies are surfaced with their code and hint", () => {
  const text = formatApiError(
    {
      error: "매장 정보가 필요합니다.",
      code: "missing_parameter",
      hint: "branchCode 를 넘기세요.",
      documentation: "https://daiso-finder.kr/developers",
      status: 400,
    },
    400,
  );

  assert.match(text, /HTTP 400/);
  assert.match(text, /code: missing_parameter/);
  assert.match(text, /hint: branchCode/);
  assert.match(text, /docs: https:\/\/daiso-finder\.kr\/developers/);
});

test("run prints help and version without hitting the network", async () => {
  const help = await run(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.text, /daiso-finder stores <keyword>/);
  assert.match(help.text, /--sandbox/);

  const version = await run(["--version"]);
  assert.match(version.text, /^\d+\.\d+\.\d+$/);

  const bare = await run([]);
  assert.equal(bare.code, 1);
});

test("run rejects unknown commands and missing arguments", async () => {
  await assert.rejects(() => run(["nope"]), UsageError);
  await assert.rejects(() => run(["stores"]), UsageError);
  await assert.rejects(() => run(["products", "11199"]), UsageError);
  await assert.rejects(() => run(["product", "1019373"]), UsageError);
  await assert.rejects(() => run(["nearby", "37.5"]), UsageError);
});
