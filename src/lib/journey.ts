import { setEventDefaults, trackEvent } from "@/lib/gtag";

/**
 * 방문자가 목적(원하는 상품의 매장 내 위치 확인)에 도달하기까지 거치는 단계.
 * 배열 순서가 그대로 퍼널 순서이자 GA4 의 `step_index` 가 된다.
 */
export const JOURNEY_STEPS = [
  "landing",
  "branch_search",
  "branch_results",
  "branch_view",
  "product_search",
  "product_results",
  "product_view",
  "product_located",
  "directions",
] as const;

export type JourneyStep = (typeof JOURNEY_STEPS)[number];

/** GA4 탐색에서 단계 이름 대신 쓸 수 있도록 1부터 세는 순번. 모르는 단계는 0. */
export function journeyStepIndex(step: string): number {
  const index = (JOURNEY_STEPS as readonly string[]).indexOf(step);
  return index < 0 ? 0 : index + 1;
}

const JOURNEY_KEY = "daiso-finder:journey";
const VISITOR_KEY = "daiso-finder:visitor";

// AI 어시스턴트는 검색엔진보다 먼저 판별한다. gemini.google.com 처럼
// 검색엔진 도메인의 하위 호스트를 쓰는 경우가 있기 때문이다.
const ASSISTANT_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "openai.com",
  "claude.ai",
  "perplexity.ai",
  "gemini.google.com",
  "bard.google.com",
  "copilot.microsoft.com",
  "wrtn.ai",
] as const;

// 블로그·카페처럼 검색엔진 도메인을 공유하는 소셜 채널도 먼저 판별한다.
const SOCIAL_HOSTS = [
  "blog.naver.com",
  "cafe.naver.com",
  "post.naver.com",
  "instagram.com",
  "facebook.com",
  "threads.net",
  "threads.com",
  "twitter.com",
  "x.com",
  "t.co",
  "youtube.com",
  "kakao.com",
  "band.us",
  "tistory.com",
  "brunch.co.kr",
  "linkedin.com",
  "reddit.com",
  "pinterest.com",
  "dcinside.com",
  "fmkorea.com",
  "clien.net",
] as const;

const SEARCH_HOSTS = [
  "google.com",
  "google.co.kr",
  "naver.com",
  "daum.net",
  "bing.com",
  "yahoo.com",
  "duckduckgo.com",
  "zum.com",
  "nate.com",
  "yandex.com",
  "baidu.com",
] as const;

function matchesHost(host: string, candidates: readonly string[]) {
  return candidates.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
}

/** 리퍼러 URL 에서 `www.` 를 뗀 호스트만 남긴다. 값이 없으면 빈 문자열. */
export function referrerHost(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export interface ChannelInput {
  /** `document.referrer` 값 */
  referrer: string;
  /** 현재 사이트 호스트 */
  currentHost: string;
  utmSource?: string | null;
  utmMedium?: string | null;
}

/**
 * 어디서 들어왔는지를 한 단어로 분류한다.
 * `direct` | `internal` | `ai_assistant` | `social` | `organic_search` |
 * `referral`, UTM 이 붙어 있으면 그 medium(없으면 `campaign`).
 */
export function classifyChannel({
  referrer,
  currentHost,
  utmSource,
  utmMedium,
}: ChannelInput): string {
  // ChatGPT 는 답변 속 링크에 `utm_source=chatgpt.com` 만 붙이고 리퍼러는
  // 보내지 않는다. UTM 규칙을 먼저 태우면 두 번째로 큰 유입원이 통째로
  // `campaign` 에 묻히므로, 어시스턴트 호스트를 가리키는 source 는 먼저 가른다.
  const source = utmSource?.trim().toLowerCase().replace(/^www\./, "");
  if (source && matchesHost(source, ASSISTANT_HOSTS)) return "ai_assistant";

  const medium = utmMedium?.trim();
  if (medium) return medium;
  if (utmSource?.trim()) return "campaign";

  const host = referrerHost(referrer);
  if (!host) return "direct";

  const site = currentHost.replace(/^www\./, "");
  if (host === site || host.endsWith(`.${site}`)) return "internal";
  if (matchesHost(host, ASSISTANT_HOSTS)) return "ai_assistant";
  if (matchesHost(host, SOCIAL_HOSTS)) return "social";
  if (matchesHost(host, SEARCH_HOSTS)) return "organic_search";
  return "referral";
}

export interface JourneyState {
  id: string;
  startedAt: number;
  entryPath: string;
  entryChannel: string;
  entrySource: string;
  entryMedium: string;
  entryCampaign: string;
  entryReferrerHost: string;
  displayMode: string;
  visitorType: string;
  /** 마지막으로 밟은 단계 */
  step: JourneyStep;
  stepAt: number;
  /** 세션 동안 가장 멀리 간 단계의 순번. 이탈 지점 분석의 기준이 된다. */
  maxStepIndex: number;
  stepCount: number;
}

// 사파리 시크릿 모드처럼 sessionStorage 를 못 쓰는 환경에서도 한 페이지
// 안에서는 여정이 이어지도록 메모리에 같은 값을 들고 있는다.
let fallbackState: JourneyState | null = null;

export type SearchType = "branch" | "product";

/**
 * 응답을 기다리는 중인 검색. 상품 검색은 매장 재고를 훑느라 수 초씩
 * 걸리는데, 그 사이에 나가 버린 방문자는 결과도 오류도 남기지 않아서
 * 따로 들고 있다가 `page_exit` 에 싣는다.
 */
let pendingSearch: { type: SearchType; path: string; startedAt: number } | null =
  null;

function readState(): JourneyState | null {
  try {
    const raw = window.sessionStorage.getItem(JOURNEY_KEY);
    if (raw) return JSON.parse(raw) as JourneyState;
  } catch {
    // 저장소를 못 읽으면 메모리 값으로 넘어간다.
  }
  return fallbackState;
}

function writeState(state: JourneyState) {
  fallbackState = state;
  try {
    window.sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(state));
  } catch {
    // 저장하지 못해도 메모리 값으로 계속 추적한다.
  }
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** PWA 로 실행 중인지. `standalone` 이면 홈 화면에서 열었다는 뜻이다. */
function getDisplayMode(): string {
  if (typeof window.matchMedia !== "function") return "browser";
  for (const mode of ["standalone", "minimal-ui", "fullscreen"]) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return mode;
  }
  // iOS 사파리는 display-mode 대신 navigator.standalone 으로만 알려준다.
  if ((window.navigator as { standalone?: boolean }).standalone) {
    return "standalone";
  }
  return "browser";
}

/** 이 브라우저에서 처음 온 방문자인지. localStorage 를 못 쓰면 `unknown`. */
function readVisitorType(): string {
  try {
    const seen = window.localStorage.getItem(VISITOR_KEY);
    window.localStorage.setItem(VISITOR_KEY, "1");
    return seen ? "returning" : "new";
  } catch {
    return "unknown";
  }
}

/**
 * 모든 이벤트에 함께 실을 여정 정보.
 *
 * 이벤트당 파라미터 25개 한도가 있어서 꼭 필요한 7개만 둔다. 빠진 유입
 * 정보(`entry_source`, `entry_medium`, `entry_campaign`,
 * `entry_referrer_host`)는 세션당 한 번 `app_entry` 가 싣고 가므로,
 * GA4 에서는 세션 범위 세그먼트로 묶어 쓰면 된다.
 */
function applyDefaults(state: JourneyState) {
  setEventDefaults({
    journey_id: state.id,
    entry_path: state.entryPath,
    entry_channel: state.entryChannel,
    display_mode: state.displayMode,
    visitor_type: state.visitorType,
    journey_step: state.step,
    journey_max_step_index: state.maxStepIndex,
  });
}

/**
 * 세션의 여정을 시작하거나 이미 시작된 여정을 돌려준다.
 * 처음 호출될 때만 유입 정보를 확정하고 `app_entry` 와
 * `funnel_step(landing)` 을 보낸다. 이후 호출은 저장된 상태를 그대로 쓴다.
 */
export function ensureJourney(): JourneyState | null {
  if (typeof window === "undefined") return null;

  const existing = readState();
  if (existing) {
    applyDefaults(existing);
    return existing;
  }

  const url = new URL(window.location.href);
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const referrer = typeof document === "undefined" ? "" : document.referrer;
  const now = Date.now();

  const state: JourneyState = {
    id: createId(),
    startedAt: now,
    entryPath: url.pathname,
    entryChannel: classifyChannel({
      referrer,
      currentHost: url.hostname,
      utmSource,
      utmMedium,
    }),
    entrySource: utmSource ?? referrerHost(referrer),
    entryMedium: utmMedium ?? "",
    entryCampaign: url.searchParams.get("utm_campaign") ?? "",
    entryReferrerHost: referrerHost(referrer),
    displayMode: getDisplayMode(),
    visitorType: readVisitorType(),
    step: "landing",
    stepAt: now,
    maxStepIndex: journeyStepIndex("landing"),
    stepCount: 1,
  };

  writeState(state);
  applyDefaults(state);

  trackEvent("app_entry", {
    entry_path: state.entryPath,
    entry_channel: state.entryChannel,
    entry_source: state.entrySource || "(none)",
    entry_medium: state.entryMedium || "(none)",
    entry_campaign: state.entryCampaign || "(none)",
    entry_referrer_host: state.entryReferrerHost || "(none)",
    entry_query: url.search.slice(1, 100),
    display_mode: state.displayMode,
    visitor_type: state.visitorType,
  });

  trackEvent("funnel_step", {
    step_name: state.step,
    step_index: state.maxStepIndex,
    previous_step: "(entry)",
    previous_step_index: 0,
    is_step_forward: true,
    is_step_repeat: false,
    seconds_since_entry: 0,
    seconds_since_previous_step: 0,
  });

  return state;
}

/**
 * 퍼널의 한 단계를 밟았다고 기록한다. 어느 단계에서 얼마나 머물다
 * 다음으로 갔는지(혹은 되돌아갔는지)가 `funnel_step` 이벤트로 남는다.
 */
export function trackJourneyStep(
  step: JourneyStep,
  params?: Record<string, unknown>,
) {
  const state = ensureJourney();
  if (!state) return;

  const now = Date.now();
  const index = journeyStepIndex(step);
  const previousIndex = journeyStepIndex(state.step);

  const next: JourneyState = {
    ...state,
    step,
    stepAt: now,
    maxStepIndex: Math.max(state.maxStepIndex, index),
    stepCount: state.stepCount + 1,
  };
  writeState(next);
  applyDefaults(next);

  trackEvent("funnel_step", {
    step_name: step,
    step_index: index,
    previous_step: state.step,
    previous_step_index: previousIndex,
    // 뒤로 돌아가거나 같은 단계를 반복하는 것도 이탈 직전 신호로 자주 쓰인다.
    is_step_forward: index > previousIndex,
    is_step_repeat: step === state.step,
    seconds_since_entry: Math.round((now - state.startedAt) / 1000),
    seconds_since_previous_step: Math.round((now - state.stepAt) / 1000),
    ...params,
  });
}

/**
 * 현재까지의 여정 요약. 이탈·체류 이벤트에 붙인다.
 * 유입 정보는 기본 파라미터로 이미 따라가므로 여기서는 뺀다.
 */
function journeySummary(state: JourneyState | null, now: number) {
  if (!state) return {};
  return {
    reached_step: state.step,
    reached_step_index: journeyStepIndex(state.step),
    max_step_index: state.maxStepIndex,
    step_count: state.stepCount,
    seconds_since_entry: Math.round((now - state.startedAt) / 1000),
  };
}

/** SPA 이동을 포함한 모든 페이지뷰. `config` 대신 직접 보내 유입 정보를 함께 싣는다. */
export function trackPageView(options?: { fromPath?: string | null }) {
  if (typeof window === "undefined") return;
  ensureJourney();

  const from = options?.fromPath;
  trackEvent("page_view", {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
    // 첫 페이지뷰는 외부 리퍼러, 이후는 직전에 보던 사이트 안의 경로.
    page_referrer: from
      ? new URL(from, window.location.origin).href
      : document.referrer,
  });
}

/**
 * 사이트 안에서 다른 페이지로 넘어갈 때의 체류 기록. 이탈이 아니라
 * 단계 이동이므로 `page_exit` 와 구분한다.
 */
export function trackPageEngagement(input: {
  path: string;
  toPath: string;
  engagedSeconds: number;
  maxScrollPercent: number;
}) {
  if (typeof window === "undefined") return;
  trackEvent("page_engagement", {
    page_path: input.path,
    to_path: input.toPath,
    engaged_seconds: input.engagedSeconds,
    max_scroll_percent: input.maxScrollPercent,
    ...journeySummary(readState(), Date.now()),
  });
}

/**
 * 화면이 가려지거나 문서가 닫힐 때 보내는 이탈 기록.
 * 세션의 마지막 `page_exit` 가 곧 "어디서 이탈했는지" 가 된다.
 */
export function trackPageExit(input: {
  path: string;
  engagedSeconds: number;
  maxScrollPercent: number;
  /** `hidden`(탭 전환·앱 이동) 또는 `pagehide`(문서 종료) */
  reason: string;
  /** 직전 클릭으로 추정한 이탈 경로: `outbound` | `internal` | `unknown` */
  intent: string;
  /** 이 페이지에서 화면이 가려진 횟수. 마지막 값일수록 진짜 이탈에 가깝다. */
  hiddenCount: number;
}) {
  if (typeof window === "undefined") return;
  trackEvent("page_exit", {
    exit_path: input.path,
    engaged_seconds: input.engagedSeconds,
    max_scroll_percent: input.maxScrollPercent,
    exit_reason: input.reason,
    exit_intent: input.intent,
    hidden_count: input.hiddenCount,
    ...journeySummary(readState(), Date.now()),
    ...pendingSearchSummary(input.path),
    // 문서가 닫히는 중에도 전송되도록 비콘을 쓴다.
    transport_type: "beacon",
  });
}

/**
 * 검색 요청을 실제로 보낸 시점. 캐시에서 바로 꺼낸 결과는 부르지 않으므로
 * `duration_ms` 가 비어 있으면 다시 보기(뒤로 가기 등)다.
 */
export function markSearchStarted(searchType: SearchType) {
  if (typeof window === "undefined") return;
  pendingSearch = {
    type: searchType,
    path: window.location.pathname,
    startedAt: Date.now(),
  };
}

/** 기다리던 검색이 끝났다. 걸린 시간을 돌려주고 대기 상태를 지운다. */
function settleSearch(searchType: SearchType): number | undefined {
  if (pendingSearch?.type !== searchType) return undefined;
  const elapsed = Date.now() - pendingSearch.startedAt;
  pendingSearch = null;
  return elapsed;
}

/**
 * 나가는 순간 검색을 기다리고 있었는지. 상품 검색 단계(`product_search`)
 * 에서 끝난 이탈이 "결과가 늦어서 포기" 인지 가르는 값이다. 다른 화면으로
 * 옮겨 간 뒤 남은 대기 상태는 그 화면의 이탈로 치지 않는다.
 */
function pendingSearchSummary(path: string) {
  if (!pendingSearch || pendingSearch.path !== path) {
    return { pending_search: "none" };
  }
  return {
    pending_search: pendingSearch.type,
    pending_search_seconds: Math.round(
      (Date.now() - pendingSearch.startedAt) / 1000,
    ),
  };
}

/**
 * 검색 실패를 원인별로 묶을 짧은 값. 메시지는 사람이 읽는 문장이라
 * GA4 측정기준으로 쓰기 어렵기 때문에 따로 둔다.
 *
 * - 던지는 쪽이 `code` 를 붙였으면 그대로 쓴다(API 오류 코드,
 *   `location_denied`, `stream_incomplete` 등).
 * - `fetch` 가 응답을 받기 전에 실패하면 `TypeError` 라 `network`.
 */
export function searchErrorKind(error: unknown): string {
  if (error && typeof error === "object") {
    const { code, name } = error as { code?: unknown; name?: unknown };
    if (typeof code === "string" && code) return code.slice(0, 40);
    if (name === "AbortError") return "aborted";
    if (name === "TypeError") return "network";
  }
  return "unknown";
}

/**
 * 검색 결과를 받아본 시점. `result_count` 가 0 인 지점이 이 서비스에서
 * 가장 흔한 이탈 원인이라 별도 이벤트로 남긴다.
 *
 * 상품 검색이 0건일 때 `scanned_count` 가 있으면 `empty_reason` 도 붙인다.
 * `no_match` 는 그런 상품이 아예 없다는 뜻이고(검색어 문제),
 * `not_in_store` 는 상품은 있는데 이 매장에 재고가 없다는 뜻이다.
 */
export function trackSearchResult(
  searchType: SearchType,
  params: {
    result_count: number;
    keyword?: string;
    search_mode?: string;
    branch_code?: string;
    scanned_count?: number;
  },
) {
  const isEmpty = params.result_count === 0;
  const scanned = params.scanned_count;
  trackEvent("search_result", {
    search_type: searchType,
    is_empty: isEmpty,
    ...params,
    duration_ms: settleSearch(searchType),
    ...(isEmpty && scanned !== undefined
      ? { empty_reason: scanned > 0 ? "not_in_store" : "no_match" }
      : {}),
  });
}

/** 검색이 실패한 시점. 빈 결과와 함께 이탈 원인을 가르는 축이다. */
export function trackSearchError(
  searchType: SearchType,
  error: unknown,
  params: { keyword?: string; branch_code?: string },
) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  trackEvent("search_error", {
    search_type: searchType,
    ...params,
    error_kind: searchErrorKind(error),
    message: message.slice(0, 100),
    duration_ms: settleSearch(searchType),
  });
}

/**
 * 원하는 상품의 매장 내 위치를 본 순간. 이 서비스의 목적 달성이라
 * GA4 에서 주요 이벤트로 표시하는 이벤트다.
 *
 * 상품 검색 결과 목록이 이미 층·구역을 보여주므로 목록이 도착한 것만으로도
 * 위치를 본 셈이다(`found_via: list`). 상세 화면의 `product_located` 단계만
 * 목적 달성으로 세면 대부분의 성공이 빠진다(`found_via: detail`).
 * `funnel_step` 은 단계 이름이 파라미터라 주요 이벤트로 표시할 수 없어서
 * 이벤트 이름을 따로 둔다.
 */
export function trackProductFound(
  foundVia: "list" | "detail",
  params: Record<string, unknown>,
) {
  trackEvent("product_found", { found_via: foundVia, ...params });
}
