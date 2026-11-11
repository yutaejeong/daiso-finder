import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_RELAX_ATTEMPTS,
  SEARCH_CONTEXT_WINDOW_MS,
  branchRelaxCandidates,
  classifyQuery,
  describeSearch,
  isRelaxStep,
  parseProductNumber,
  relateKeywords,
} from "@/lib/searchQuery";

const keywords = (input) => branchRelaxCandidates(input).map((c) => c.keyword);

test("brand word is stripped from a store keyword", () => {
  assert.deepEqual(branchRelaxCandidates("다이소 홍대입구점"), [
    { keyword: "홍대입구점", step: "strip_brand" },
  ]);
  assert.deepEqual(keywords("아성다이소 송탄"), ["송탄"]);
  assert.deepEqual(keywords("Daiso 수원역점"), ["수원역점"]);
});

test("spaces are joined before single words are tried", () => {
  assert.deepEqual(branchRelaxCandidates("부산 양정점"), [
    { keyword: "부산양정점", step: "join_spaces" },
    { keyword: "양정점", step: "token" },
    { keyword: "부산", step: "token" },
  ]);
});

test("brand, spaces, and words are relaxed in that order", () => {
  assert.deepEqual(
    branchRelaxCandidates("다이소 대구 성서이곡점").map((c) => c.step),
    ["strip_brand", "join_spaces", "token", "token"],
  );
  assert.equal(keywords("다이소 대구 성서이곡점")[0], "대구 성서이곡점");
});

test("an address prefers its road name over the region", () => {
  const [first] = branchRelaxCandidates(
    "전남광주통합특별시 북구 용봉택지로 53 1층",
  ).filter((c) => c.step === "token");
  assert.equal(first.keyword, "용봉택지로");
});

test("numbers and floors are not worth searching on their own", () => {
  const tokens = keywords("용봉택지로 53 1층 12호");
  assert.ok(!tokens.includes("53"));
  assert.ok(!tokens.includes("1층"));
  assert.ok(!tokens.includes("12호"));
});

test("keywords that cannot match a Korean store name get no retries", () => {
  assert.deepEqual(keywords("다이소"), []);
  assert.deepEqual(keywords("Seoul station"), []);
  assert.deepEqual(keywords("1056103"), []);
  assert.deepEqual(keywords("강남"), []);
  assert.deepEqual(keywords("  "), []);
});

test("relaxation stays within the attempt cap and never repeats", () => {
  const list = keywords("다이소 서울 강남구 테헤란로 역삼동 본점");
  assert.ok(list.length <= MAX_RELAX_ATTEMPTS);
  assert.equal(new Set(list).size, list.length);
});

test("relax steps are recognised", () => {
  assert.ok(isRelaxStep("strip_brand"));
  assert.ok(isRelaxStep("join_spaces"));
  assert.ok(isRelaxStep("token"));
  assert.ok(!isRelaxStep("nope"));
  assert.ok(!isRelaxStep(null));
});

test("product numbers are seven digits, with or without a label", () => {
  assert.equal(parseProductNumber("1047181"), "1047181");
  assert.equal(parseProductNumber(" 1047181 "), "1047181");
  assert.equal(parseProductNumber("품번 1047181"), "1047181");
  assert.equal(parseProductNumber("상품번호: 1047181"), "1047181");
  assert.equal(parseProductNumber("#1047181"), "1047181");
  assert.equal(parseProductNumber("No.1047181"), "1047181");
  assert.equal(parseProductNumber("104718"), null);
  assert.equal(parseProductNumber("10471811"), null);
  assert.equal(parseProductNumber("A4"), null);
  assert.equal(parseProductNumber("1047181 박스"), null);
});

test("queries are grouped by the shapes that split zero-result rates", () => {
  assert.equal(classifyQuery(""), "empty");
  assert.equal(classifyQuery("(location)"), "location");
  assert.equal(classifyQuery("1047181"), "product_number");
  assert.equal(classifyQuery("123"), "digits");
  assert.equal(classifyQuery("다이소 명동"), "brand");
  assert.equal(classifyQuery("Myeongdong"), "latin");
  assert.equal(classifyQuery("ㅇ산"), "jamo");
  assert.equal(
    classifyQuery("한글 키보드 스티커는 어느 코너에 있어요"),
    "long",
  );
  assert.equal(classifyQuery("부산 양정점"), "multi_word");
  assert.equal(classifyQuery("강남"), "single_word");
});

test("keywords are related the way users rewrite them", () => {
  assert.equal(relateKeywords("택배박스", "택배 박스"), "same");
  assert.equal(relateKeywords("택배박스", "박스"), "shorter");
  assert.equal(relateKeywords("박스", "택배박스"), "longer");
  assert.equal(relateKeywords("머그커", "머그컵"), "prefix");
  assert.equal(relateKeywords("오뎅", "어묵"), "different");
  assert.equal(relateKeywords("USB", "usb"), "same");
});

const now = 1_000_000_000;

test("the first search has no previous search to relate to", () => {
  const { params, next } = describeSearch(
    null,
    { type: "product", keyword: "택배박스", empty: true },
    { now },
  );
  assert.equal(params.prev_keyword_relation, "none");
  assert.equal(params.empty_streak, 1);
  assert.equal(params.query_kind, "single_word");
  assert.equal(params.query_length, 4);
  assert.equal(params.seconds_since_prev_search, undefined);
  assert.deepEqual(next, {
    type: "product",
    keyword: "택배박스",
    empty: true,
    at: now,
    streak: 1,
  });
});

test("consecutive empty searches build a streak and a relation", () => {
  const first = describeSearch(
    null,
    { type: "product", keyword: "택배박스", empty: true },
    { now },
  ).next;
  const second = describeSearch(
    first,
    { type: "product", keyword: "박스", empty: true },
    { now: now + 20_000 },
  );
  assert.equal(second.params.prev_keyword_relation, "shorter");
  assert.equal(second.params.empty_streak, 2);
  assert.equal(second.params.seconds_since_prev_search, 20);

  const third = describeSearch(
    second.next,
    { type: "product", keyword: "상자", empty: false },
    { now: now + 30_000 },
  );
  assert.equal(third.params.prev_keyword_relation, "different");
  assert.equal(third.params.empty_streak, 0);
  assert.equal(third.next.streak, 0);
});

test("a streak carries across store and product searches", () => {
  const first = describeSearch(
    null,
    { type: "branch", keyword: "가방", empty: true },
    { now },
  ).next;
  const second = describeSearch(
    first,
    { type: "product", keyword: "가방", empty: true },
    { now: now + 5000 },
  );
  assert.equal(second.params.prev_keyword_relation, "other_type");
  assert.equal(second.params.empty_streak, 2);
});

test("an old search is not treated as the previous attempt", () => {
  const first = describeSearch(
    null,
    { type: "product", keyword: "박스", empty: true },
    { now },
  ).next;
  const later = describeSearch(
    first,
    { type: "product", keyword: "박스", empty: true },
    { now: now + SEARCH_CONTEXT_WINDOW_MS + 1000 },
  );
  assert.equal(later.params.prev_keyword_relation, "none");
  assert.equal(later.params.empty_streak, 1);
});

test("a restored result leaves the search record alone", () => {
  const previous = {
    type: "product",
    keyword: "박스",
    empty: true,
    at: now,
    streak: 2,
  };
  const { params, next } = describeSearch(
    previous,
    { type: "product", keyword: "박스", empty: true },
    { now: now + 1000, restored: true },
  );
  assert.equal(params.prev_keyword_relation, "restored");
  assert.equal(next, previous);
});

test("location searches do not enter the keyword history", () => {
  const previous = {
    type: "branch",
    keyword: "강남",
    empty: true,
    at: now,
    streak: 1,
  };
  const { params, next } = describeSearch(
    previous,
    { type: "branch", keyword: "(location)", empty: false },
    { now: now + 1000 },
  );
  assert.equal(params.query_kind, "location");
  assert.equal(params.empty_streak, 0);
  assert.equal(next, previous);
});
