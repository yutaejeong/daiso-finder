import assert from "node:assert/strict";
import { test } from "node:test";
import {
  branchSearchModeToParams,
  parseBranchSearchMode,
  parseSearchKeyword,
  searchKeywordToParams,
} from "@/lib/searchParams";

test("keyword round-trips through the query string", () => {
  const params = searchKeywordToParams("강남");
  assert.equal(params.toString(), "q=%EA%B0%95%EB%82%A8");
  assert.equal(parseSearchKeyword(params), "강남");
});

test("blank keywords leave the query string empty", () => {
  assert.equal(searchKeywordToParams("   ").toString(), "");
  assert.equal(parseSearchKeyword(new URLSearchParams()), "");
  assert.equal(parseSearchKeyword(new URLSearchParams("q=%20%20")), "");
});

test("keyword search mode round-trips", () => {
  const mode = { type: "keyword", keyword: "홍대" };
  const params = branchSearchModeToParams(mode);
  assert.deepEqual(parseBranchSearchMode(params), mode);
});

test("location search mode round-trips within coordinate precision", () => {
  const params = branchSearchModeToParams({
    type: "location",
    lat: 37.4979462,
    lng: 127.0276194,
  });
  assert.equal(params.toString(), "lat=37.497946&lng=127.027619");
  assert.deepEqual(parseBranchSearchMode(params), {
    type: "location",
    lat: 37.497946,
    lng: 127.027619,
  });
});

test("no search condition means no mode", () => {
  assert.equal(parseBranchSearchMode(new URLSearchParams()), null);
  assert.equal(parseBranchSearchMode(new URLSearchParams("lat=37.5")), null);
  assert.equal(
    parseBranchSearchMode(new URLSearchParams("lat=here&lng=there")),
    null,
  );
});

test("a keyword wins over stale coordinates", () => {
  assert.deepEqual(
    parseBranchSearchMode(
      new URLSearchParams("q=%EB%B3%BC%ED%8E%9C&lat=37.5&lng=127"),
    ),
    { type: "keyword", keyword: "볼펜" },
  );
});
