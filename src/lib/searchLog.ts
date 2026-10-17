/**
 * 검색어·조회 수집. 매장 검색과 매장 내 상품 검색의 검색어, 그리고 매장·상품
 * 상세 조회를 구글 스프레드시트에 한 줄씩 쌓는다. 실제 쓰기는 Apps Script
 * 웹앱이 담당하고, 여기서는 그 웹앱에 JSON 한 건을 POST 한다. 같은 행을 Vercel
 * 런타임 로그에도 JSON 한 줄로 남긴다. 설정은 `docs/search-logs.md` 참고.
 *
 * 기록은 어디까지나 부가 기능이므로 검색 응답을 절대 막거나 실패시키지 않는다.
 * 웹훅 주소가 없으면 시트 쪽은 조용히 아무것도 하지 않는다.
 */

/**
 * `branch`·`product` 는 검색, `branch_view`·`product_view` 는 상세 화면 조회.
 * 조회 행은 나중에 인기 매장·인기 상품을 뽑는 데 쓴다.
 */
export type SearchLogType =
  | "branch"
  | "product"
  | "branch_view"
  | "product_view";

/** 매장 검색인지, 매장 안에서 상품을 찾는 검색인지 */
export type SearchType = Extract<SearchLogType, "branch" | "product">;

export type ViewLogType = Extract<
  SearchLogType,
  "branch_view" | "product_view"
>;

/**
 * 웹 UI 에서 들어온 검색인지, API·MCP·CLI 로 직접 들어온 호출인지.
 * 웹 UI 는 `x-search-source: web` 헤더를 붙여 스스로를 밝힌다.
 */
export type SearchLogSource = "web" | "api";

export type SearchLogStatus = "ok" | "error";

export interface SearchLogEntry {
  type: SearchType;
  keyword: string;
  source: SearchLogSource;
  /** 상품 검색이라면 검색한 매장 코드 */
  branchCode?: string | null;
  /** 검색 결과 건수. 오류로 끝났으면 생략한다. */
  resultCount?: number | null;
  status?: SearchLogStatus;
}

/** 웹 UI 가 매장·상품 상세 화면을 열었을 때 보내는 조회 한 건 */
export interface ViewLogEntry {
  type: ViewLogType;
  branchCode: string;
  /** 상품 조회라면 상품 번호 */
  productId?: string | null;
  /** 상품 조회라면 화면에 보인 상품명. 시트를 눈으로 읽기 위한 값이다. */
  productName?: string | null;
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
  productId: string;
  productName: string;
}

/** 웹 UI 가 스스로를 밝히는 요청 헤더 */
export const SEARCH_SOURCE_HEADER = "x-search-source";

const WEBHOOK_TIMEOUT_MS = 5000;

/** 스프레드시트 셀 하나에 들어갈 검색어·상품명 길이 상한 */
const MAX_KEYWORD_LENGTH = 200;

/** 매장 코드·상품 번호로 받아들이는 형태. 다이소 코드는 숫자뿐이지만 여유를 둔다. */
const CODE_PATTERN = /^[0-9A-Za-z_-]{1,32}$/;

/** Vercel 런타임 로그에서 이 기록만 골라낼 때 쓰는 표식 */
export const CONSOLE_LOG_NAME = "daiso_finder_activity";

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
    productId: "",
    productName: "",
  };
}

function readCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const code = value.trim();
  return CODE_PATTERN.test(code) ? code : null;
}

/**
 * `POST /api/views` 본문을 조회 한 건으로 읽는다. 누구나 보낼 수 있는 본문이므로
 * 형태가 어긋나면 `null` 을 돌려주고 기록하지 않는다.
 */
export function parseViewLogEntry(body: unknown): ViewLogEntry | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  const branchCode = readCode(record.branchCode);
  if (!branchCode) {
    return null;
  }

  if (record.type === "branch_view") {
    return { type: "branch_view", branchCode };
  }

  if (record.type === "product_view") {
    const productId = readCode(record.productId);
    if (!productId) {
      return null;
    }
    const productName =
      typeof record.productName === "string" ? record.productName : null;
    return { type: "product_view", branchCode, productId, productName };
  }

  return null;
}

/**
 * 조회 행을 만든다. 조회는 웹 UI 에서만 보내므로 유입 경로는 언제나 `web` 이다.
 */
export function buildViewLogRow(
  entry: ViewLogEntry,
  now: Date = new Date(),
): SearchLogRow {
  return {
    timestamp: now.toISOString(),
    type: entry.type,
    keyword: "",
    branchCode: entry.branchCode.trim(),
    resultCount: "",
    source: "web",
    status: "ok",
    productId: entry.productId?.trim() ?? "",
    productName: (entry.productName?.trim() ?? "").slice(0, MAX_KEYWORD_LENGTH),
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
 * 런타임 로그에도 남길지. `SEARCH_LOG_CONSOLE` 로 직접 켜고 끌 수 있고, 값이
 * 없으면 Vercel 에서 돌 때만(`VERCEL` 환경변수가 있을 때) 켠다. 로컬 개발
 * 터미널을 매 검색마다 JSON 으로 채우지 않기 위해서다.
 */
export function isConsoleLogEnabled() {
  const flag = process.env.SEARCH_LOG_CONSOLE?.trim().toLowerCase();
  if (flag === "1" || flag === "true") {
    return true;
  }
  if (flag === "0" || flag === "false") {
    return false;
  }
  return Boolean(process.env.VERCEL);
}

/**
 * 행 하나를 JSON 한 줄로 표준 출력에 쓴다. Vercel 은 이 줄을 런타임 로그로
 * 모으므로 대시보드에서 `daiso_finder_activity` 로 검색하거나 로그 드레인으로
 * 내보낼 수 있다.
 */
export function writeConsoleLogRow(row: SearchLogRow) {
  console.log(JSON.stringify({ log: CONSOLE_LOG_NAME, ...row }));
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
 * 행 하나를 런타임 로그와 스프레드시트에 남긴다. 호출한 쪽을 기다리게 하지
 * 않고, 실패해도 던지지 않는다. 반환되는 Promise 는 테스트에서 전송 완료를
 * 기다리기 위한 것이다.
 */
function recordRow(row: SearchLogRow): Promise<void> {
  if (isConsoleLogEnabled()) {
    writeConsoleLogRow(row);
  }

  if (!isSearchLogEnabled()) {
    return Promise.resolve();
  }

  const task = sendSearchLogRow(row).catch((error) => {
    console.error("검색어 기록 실패:", error);
  });

  keepAlive(task);

  return task;
}

/** 검색 한 건을 기록한다. 검색어가 없는 검색은 남기지 않는다. */
export function logSearch(entry: SearchLogEntry): Promise<void> {
  const row = buildSearchLogRow(entry);
  return row ? recordRow(row) : Promise.resolve();
}

/** 매장·상품 상세 조회 한 건을 기록한다. */
export function logView(entry: ViewLogEntry): Promise<void> {
  return recordRow(buildViewLogRow(entry));
}
