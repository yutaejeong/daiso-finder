/**
 * 검색어를 다루는 순수 함수 모음. 서버(API 라우트)와 브라우저(화면·GA4 계측)가
 * 같이 쓰므로 `window` 나 SDK 에 기대지 않는다.
 *
 * 만든 이유는 검색어 로그 분석(docs/reports/zero-result-analysis-2026-11-11.html)이다.
 * 웹 검색의 절반이 0건이었고, 그중 상당수가 "검색은 글자 일치인데 사람은 말하듯
 * 쓰는" 어긋남이었다.
 *
 * - 매장 검색은 점포 이름·주소의 글자 일치로 동작한다. 점포명은 `부산양정점` 처럼
 *   지역과 동네를 붙여 쓰고 `다이소` 는 들어 있지 않다. 그래서 "다이소 홍대입구점"
 *   은 100%, 띄어쓰기가 든 검색어는 97% 가 0건이었다.
 * - 상품 번호 7자리를 상품 검색창에 넣는 사람이 있다.
 */

const HANGUL = /[가-힣]/;
const JAMO = /[ㄱ-ㅎㅏ-ㅣ]/;
const BRAND = /아성\s*다이소|다이소|daiso/gi;

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// 매장 검색어 완화
// ---------------------------------------------------------------------------

/**
 * 매장 검색이 0건일 때 어떻게 고쳐서 다시 찾았는지.
 *
 * - `strip_brand`: 점포명에 없는 `다이소` 를 뺐다.
 * - `join_spaces`: 띄어쓰기를 지웠다. 점포명은 `부산양정점` 처럼 붙어 있다.
 * - `token`: 검색어의 단어 하나만 썼다.
 */
export type RelaxStep = "strip_brand" | "join_spaces" | "token";

export interface RelaxCandidate {
  keyword: string;
  step: RelaxStep;
}

export interface RelaxedSearch {
  /** 실제로 검색해 결과가 나온 검색어 */
  keyword: string;
  step: RelaxStep;
}

/** 원래 검색어 뒤에 더 시도하는 최대 횟수. 다이소 API 호출이 그만큼 늘어난다. */
export const MAX_RELAX_ATTEMPTS = 4;

export const RELAXED_KEYWORD_HEADER = "x-search-relaxed-keyword";
export const RELAXED_STEP_HEADER = "x-search-relaxed-step";

const RELAX_STEPS: readonly string[] = [
  "strip_brand",
  "join_spaces",
  "token",
] satisfies RelaxStep[];

export function isRelaxStep(value: unknown): value is RelaxStep {
  return typeof value === "string" && RELAX_STEPS.includes(value);
}

// 지명 단어는 길이가 같으면 점포명·도로명처럼 끝나는 쪽이 더 구체적이다.
const SPECIFIC_ENDING = /(점|로|길|역|동|읍|면)$/;

function isInformativeToken(token: string): boolean {
  if (token.length < 2) return false;
  if (!HANGUL.test(token)) return false;
  // 번지·층·호수는 어느 주소에나 있어서 단어 하나로는 아무 매장이나 걸린다.
  if (/^\d/.test(token) || /(층|호)$/.test(token)) return false;
  return true;
}

/**
 * 원래 검색어가 0건일 때 순서대로 다시 시도해 볼 검색어. 앞의 것일수록 원래
 * 의도에 가깝다. 한글이 없는 검색어(영문·숫자)는 고쳐도 점포명과 맞지 않아서
 * 후보에서 뺀다.
 */
export function branchRelaxCandidates(keyword: string): RelaxCandidate[] {
  const original = collapse(keyword);
  const seen = new Set<string>([original]);
  const candidates: RelaxCandidate[] = [];

  const add = (text: string, step: RelaxStep) => {
    const next = collapse(text);
    if (next.length < 2 || !HANGUL.test(next) || seen.has(next)) return;
    seen.add(next);
    candidates.push({ keyword: next, step });
  };

  const stripped = collapse(original.replace(BRAND, " "));
  add(stripped, "strip_brand");

  const base = stripped || original;
  if (/\s/.test(base)) add(base.replace(/\s+/g, ""), "join_spaces");

  const tokens = base
    .split(" ")
    .filter(isInformativeToken)
    .map((token, index) => ({
      token,
      index,
      score: token.length + (SPECIFIC_ENDING.test(token) ? 5 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  // 단어가 하나뿐이면 단어 시도는 원래 검색어와 같아 위의 중복 검사에서 걸러진다.
  for (const { token } of tokens.slice(0, 2)) add(token, "token");

  return candidates.slice(0, MAX_RELAX_ATTEMPTS);
}

// ---------------------------------------------------------------------------
// 상품 번호
// ---------------------------------------------------------------------------

/** 다이소 상품 번호는 7자리 숫자다(예: 1047181). */
const PRODUCT_NUMBER = /^(?:(?:품번|상품\s*번호|no\.?|#)\s*:?\s*)?(\d{7})$/i;

/**
 * 상품 검색창에 입력한 값이 상품 번호면 그 번호를 돌려준다. `품번 1047181`,
 * `#1047181` 처럼 말머리가 붙은 것도 받는다.
 */
export function parseProductNumber(input: string): string | null {
  const match = collapse(input).match(PRODUCT_NUMBER);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// 계측용 분류
// ---------------------------------------------------------------------------

/**
 * 검색어의 모양. GA4 에서 "어떤 입력이 0건이 되나" 를 가르는 측정기준이다.
 * 분석에서 0건률이 갈렸던 경계(공백·영문·'다이소'·숫자·길이)를 그대로 쓴다.
 */
export type QueryKind =
  | "empty"
  | "location"
  | "product_number"
  | "digits"
  | "brand"
  | "latin"
  | "jamo"
  | "long"
  | "multi_word"
  | "single_word";

export function classifyQuery(keyword: string): QueryKind {
  const text = collapse(keyword);
  if (!text) return "empty";
  if (text === "(location)") return "location";
  if (parseProductNumber(text)) return "product_number";
  if (/^[\d\s\-.]+$/.test(text)) return "digits";
  if (/다이소|daiso/i.test(text)) return "brand";
  if (!HANGUL.test(text)) return "latin";
  if (JAMO.test(text)) return "jamo";
  const words = text.split(" ").length;
  if (text.length >= 15 || words >= 5) return "long";
  return words >= 2 ? "multi_word" : "single_word";
}

/** 직전 검색어와 이번 검색어의 관계. 사용자가 0건 뒤에 어떻게 고쳐 쓰는지 본다. */
export type KeywordRelation =
  | "none"
  | "other_type"
  | "restored"
  | "same"
  | "shorter"
  | "longer"
  | "prefix"
  | "different";

function normalizeKeyword(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

export function relateKeywords(
  previous: string,
  current: string,
): Exclude<KeywordRelation, "none" | "other_type" | "restored"> {
  const a = normalizeKeyword(previous);
  const b = normalizeKeyword(current);
  if (a === b) return "same";
  if (a.includes(b)) return "shorter";
  if (b.includes(a)) return "longer";
  if (a.slice(0, 2) === b.slice(0, 2)) return "prefix";
  return "different";
}

export type SearchKind = "branch" | "product";

/** 마지막으로 결과를 받은 검색. 같은 방문 안에서 다음 검색과 이어 본다. */
export interface LastSearch {
  type: SearchKind;
  keyword: string;
  empty: boolean;
  at: number;
  /** 이 검색까지 연속으로 0건이 이어진 횟수. 결과가 있었으면 0. */
  streak: number;
}

/** 이보다 오래 지난 검색은 이어진 시도로 보지 않는다. */
export const SEARCH_CONTEXT_WINDOW_MS = 30 * 60 * 1000;

export interface SearchContextParams {
  query_length: number;
  query_kind: QueryKind;
  prev_keyword_relation: KeywordRelation;
  seconds_since_prev_search?: number;
  empty_streak: number;
}

/**
 * 이번 검색 결과에 붙일 맥락(직전 검색과의 관계, 연속 0건 횟수)과, 다음 검색이
 * 이어 볼 기록을 계산한다.
 *
 * - 위치 검색은 검색어가 없어 기록에서 뺀다.
 * - 캐시에서 꺼낸 결과(뒤로 가기)는 새 시도가 아니므로 기록을 바꾸지 않는다.
 * - 연속 0건은 매장 검색과 상품 검색을 가리지 않고 센다. 매장 검색에서 0건을
 *   겪고 상품 검색에서 또 0건을 겪은 방문도 같은 좌절이다.
 */
export function describeSearch(
  previous: LastSearch | null,
  current: { type: SearchKind; keyword: string; empty: boolean },
  options: { now: number; restored?: boolean },
): { params: SearchContextParams; next: LastSearch | null } {
  const keyword = collapse(current.keyword);
  const kind = classifyQuery(keyword);
  const base = { query_length: keyword.length, query_kind: kind };

  const live =
    previous && options.now - previous.at <= SEARCH_CONTEXT_WINDOW_MS
      ? previous
      : null;
  const streak = live?.streak ?? 0;

  if (options.restored || kind === "location") {
    return {
      params: {
        ...base,
        prev_keyword_relation: options.restored ? "restored" : "none",
        empty_streak: current.empty ? streak : 0,
      },
      next: previous,
    };
  }

  let relation: KeywordRelation = "none";
  let seconds: number | undefined;
  if (live) {
    seconds = Math.round((options.now - live.at) / 1000);
    relation =
      live.type === current.type
        ? relateKeywords(live.keyword, keyword)
        : "other_type";
  }

  const emptyStreak = current.empty ? streak + 1 : 0;
  return {
    params: {
      ...base,
      prev_keyword_relation: relation,
      ...(seconds === undefined ? {} : { seconds_since_prev_search: seconds }),
      empty_streak: emptyStreak,
    },
    next: {
      type: current.type,
      keyword,
      empty: current.empty,
      at: options.now,
      streak: emptyStreak,
    },
  };
}
