/**
 * 검색어 수집. 매장 검색과 매장 내 상품 검색의 검색어를 구글 스프레드시트에
 * 한 줄씩 쌓는다. 실제 쓰기는 Apps Script 웹앱이 담당하고, 여기서는 그 웹앱에
 * JSON 한 건을 POST 한다. 설정은 `docs/search-logs.md` 참고.
 *
 * 기록은 어디까지나 부가 기능이므로 검색 응답을 절대 막거나 실패시키지 않는다.
 * 웹훅 주소가 없으면 조용히 아무것도 하지 않는다.
 */

/** 매장 검색인지, 매장 안에서 상품을 찾는 검색인지 */
export type SearchLogType = "branch" | "product";

/**
 * 웹 UI 에서 들어온 검색인지, API·MCP·CLI 로 직접 들어온 호출인지.
 * 웹 UI 는 `x-search-source: web` 헤더를 붙여 스스로를 밝힌다.
 */
export type SearchLogSource = "web" | "api";

export type SearchLogStatus = "ok" | "error";

export interface SearchLogEntry {
  type: SearchLogType;
  keyword: string;
  source: SearchLogSource;
  /** 상품 검색이라면 검색한 매장 코드 */
  branchCode?: string | null;
  /** 검색 결과 건수. 오류로 끝났으면 생략한다. */
  resultCount?: number | null;
  status?: SearchLogStatus;
}

/** 스프레드시트 한 행. 열 순서는 Apps Script 쪽 HEADERS 와 맞춰야 한다. */
export interface SearchLogRow {
  timestamp: string;
  type: SearchLogType;
  keyword: string;
  branchCode: string;
  resultCount: number | "";
  source: SearchLogSource;
  status: SearchLogStatus;
}

/** 웹 UI 가 스스로를 밝히는 요청 헤더 */
export const SEARCH_SOURCE_HEADER = "x-search-source";

const WEBHOOK_TIMEOUT_MS = 5000;

/** 스프레드시트 셀 하나에 들어갈 검색어 길이 상한 */
const MAX_KEYWORD_LENGTH = 200;

interface HeaderLike {
  get(name: string): string | null;
}

/**
 * 요청이 웹 UI 에서 왔는지 판별한다. 헤더가 없으면 API 직접 호출로 본다.
 */
export function searchLogSource(headers: HeaderLike): SearchLogSource {
  return headers.get(SEARCH_SOURCE_HEADER)?.trim().toLowerCase() === "web"
    ? "web"
    : "api";
}

/**
 * 기록할 행을 만든다. 검색어가 비어 있으면(예: 위치 기반 매장 검색) 남길
 * 검색어가 없으므로 `null` 을 돌려준다.
 */
export function buildSearchLogRow(
  entry: SearchLogEntry,
  now: Date = new Date(),
): SearchLogRow | null {
  const keyword = entry.keyword?.trim() ?? "";
  if (!keyword) {
    return null;
  }

  return {
    timestamp: now.toISOString(),
    type: entry.type,
    keyword: keyword.slice(0, MAX_KEYWORD_LENGTH),
    branchCode: entry.branchCode?.trim() || "",
    resultCount:
      typeof entry.resultCount === "number" &&
      Number.isFinite(entry.resultCount)
        ? entry.resultCount
        : "",
    source: entry.source,
    status: entry.status ?? "ok",
  };
}

function getWebhookConfig() {
  const url = process.env.SEARCH_LOG_WEBHOOK_URL?.trim();
  if (!url) {
    return null;
  }
  return { url, token: process.env.SEARCH_LOG_WEBHOOK_TOKEN?.trim() ?? "" };
}

/** 웹훅 주소가 설정되어 있는지 */
export function isSearchLogEnabled() {
  return getWebhookConfig() !== null;
}

/**
 * Apps Script 웹앱으로 행 하나를 보낸다. 응답 본문은 쓰지 않으므로 읽지 않는다.
 */
export async function sendSearchLogRow(row: SearchLogRow): Promise<void> {
  const config = getWebhookConfig();
  if (!config) {
    return;
  }

  // Apps Script 웹앱은 302 로 실제 실행 주소를 가리키므로 리다이렉트를 따라간다.
  const response = await fetch(config.url, {
    method: "POST",
    // Apps Script 는 text/plain 본문을 e.postData.contents 로 그대로 넘겨준다.
    // application/json 으로 보내면 프리플라이트·리다이렉트에서 본문이 유실될 수 있다.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: config.token, rows: [row] }),
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`검색어 기록 웹훅이 ${response.status} 를 반환했습니다.`);
  }
}

type VercelRequestContext = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

/**
 * 응답을 보낸 뒤에도 전송이 끝나도록 붙잡아 둔다. Vercel 서버리스는 응답과
 * 함께 인스턴스를 정리하므로 request context 의 `waitUntil` 이 있으면 쓰고,
 * 자체 호스팅(`next start`)에서는 프로세스가 계속 살아 있으므로 그냥 둔다.
 */
function keepAlive(task: Promise<unknown>) {
  const store = Reflect.get(
    globalThis,
    Symbol.for("@vercel/request-context"),
  ) as { get?: () => VercelRequestContext | undefined } | undefined;

  const context = store?.get?.();
  if (typeof context?.waitUntil === "function") {
    context.waitUntil(task);
  }
}

/**
 * 검색 한 건을 기록한다. 호출한 쪽을 기다리게 하지 않고, 실패해도 던지지 않는다.
 * 반환되는 Promise 는 테스트에서 전송 완료를 기다리기 위한 것이다.
 */
export function logSearch(entry: SearchLogEntry): Promise<void> {
  const row = buildSearchLogRow(entry);
  if (!row || !isSearchLogEnabled()) {
    return Promise.resolve();
  }

  const task = sendSearchLogRow(row).catch((error) => {
    console.error("검색어 기록 실패:", error);
  });

  keepAlive(task);

  return task;
}
