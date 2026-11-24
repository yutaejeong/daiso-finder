import { createHmac } from "node:crypto";

/**
 * 쿠팡 파트너스 Open API 의 상품 검색. 매장 상품 검색이 0건일 때 같은 검색어로
 * 쿠팡 상품을 광고로 보여주는 데 쓴다(`/api/partners/coupang`).
 *
 * - `COUPANG_PARTNERS_ACCESS_KEY` / `COUPANG_PARTNERS_SECRET_KEY` 가 없으면 꺼진다.
 * - 검색 API 는 키 하나당 시간당 50회로 묶여 있어 검색어별로 오래 캐시하고,
 *   인스턴스마다 시간당 호출 수를 그보다 낮게 묶는다. 한도를 넘기면 빈 목록이다.
 * - 광고는 화면의 부가 요소라 어떤 실패도 던지지 않고 빈 목록으로 끝낸다.
 */

export const COUPANG_API_ORIGIN = "https://api-gateway.coupang.com";
export const COUPANG_SEARCH_PATH =
  "/v2/providers/affiliate_open_api/apis/openapi/products/search";

/** 쿠팡 파트너스 활동 고지 문구. 광고 바로 곁에 그대로 보여야 한다(파트너스 약관). */
export const COUPANG_PARTNERS_DISCLOSURE =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

/** 한 번에 보여줄 광고 수. 검색 API 의 limit 상한은 10 이다. */
export const COUPANG_AD_LIMIT = 4;
const IMAGE_SIZE = "240x240";
const MAX_KEYWORD_LENGTH = 50;

/** 상품이 있는 결과는 오래, 빈 결과·실패는 짧게 둔다. */
const HIT_TTL_MS = 6 * 60 * 60 * 1000;
const MISS_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
/** 키당 시간당 50회 한도보다 낮게 잡아 여러 인스턴스가 떠도 여유를 둔다. */
const MAX_CALLS_PER_HOUR = 40;
const REQUEST_TIMEOUT_MS = 3000;

export interface CoupangAd {
  id: string;
  name: string;
  price: number;
  image: string | null;
  url: string;
  isRocket: boolean;
  isFreeShipping: boolean;
}

export interface CoupangAdList {
  items: CoupangAd[];
  /** 광고가 있을 때 함께 보여줄 고지 문구 */
  disclosure: string;
}

interface CoupangConfig {
  accessKey: string;
  secretKey: string;
  subId?: string;
}

/**
 * 광고가 나가는 곳. 쿠팡 리포트에서 웹과 MCP 실적을 가를 수 있게 채널마다
 * 다른 subId 를 쓸 수 있다(`COUPANG_PARTNERS_MCP_SUB_ID`, 없으면 웹 값).
 */
export type CoupangAdChannel = "web" | "mcp";

function getConfig(channel: CoupangAdChannel = "web"): CoupangConfig | null {
  const accessKey = process.env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = process.env.COUPANG_PARTNERS_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) {
    return null;
  }
  const webSubId = process.env.COUPANG_PARTNERS_SUB_ID?.trim();
  const subId =
    channel === "mcp"
      ? process.env.COUPANG_PARTNERS_MCP_SUB_ID?.trim() || webSubId
      : webSubId;
  return { accessKey, secretKey, ...(subId ? { subId } : {}) };
}

export function isCoupangPartnersEnabled() {
  return getConfig() !== null;
}

/** 앞뒤 공백을 걷고 연속 공백을 하나로 줄인다. 광고를 찾을 거리가 없으면 빈 문자열. */
export function normalizeAdKeyword(keyword: string | null | undefined) {
  return (keyword ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_KEYWORD_LENGTH)
    .trim();
}

/** 서명 시각. UTC 기준 `yyMMdd'T'HHmmss'Z'` (예: 261124T091502Z) */
export function formatSignedDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    pad(date.getUTCFullYear() % 100) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * 쿠팡 Open API 의 HMAC 인증 헤더. 서명 대상은 `시각 + 메서드 + 경로 + 쿼리`
 * (쿼리는 `?` 없이, 실제로 보내는 인코딩 그대로)다.
 */
export function buildCoupangAuthorization({
  method,
  path,
  query,
  accessKey,
  secretKey,
  now = new Date(),
}: {
  method: string;
  path: string;
  query: string;
  accessKey: string;
  secretKey: string;
  now?: Date;
}) {
  const signedDate = formatSignedDate(now);
  const signature = createHmac("sha256", secretKey)
    .update(signedDate + method + path + query)
    .digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

export function buildCoupangSearchQuery(
  keyword: string,
  limit = COUPANG_AD_LIMIT,
  subId?: string,
) {
  const params = [
    `keyword=${encodeURIComponent(keyword)}`,
    `limit=${limit}`,
    `imageSize=${IMAGE_SIZE}`,
  ];
  if (subId) {
    params.push(`subId=${encodeURIComponent(subId)}`);
  }
  return params.join("&");
}

/** 쿠팡이 돌려준 주소 중 우리가 화면에 그대로 내보내도 되는 것만 남긴다. */
function safeHttpsUrl(value: unknown, hostSuffixes: readonly string[]) {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    const allowed = hostSuffixes.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
    return allowed ? url.href : null;
  } catch {
    return null;
  }
}

const LINK_HOSTS = ["coupang.com"] as const;
const IMAGE_HOSTS = ["coupang.com", "coupangcdn.com"] as const;

/**
 * 검색 API 응답(`{ rCode, data: { productData: [...] } }`)을 화면용 목록으로 바꾼다.
 * 형태가 어긋난 항목, 쿠팡 밖을 가리키는 링크는 버린다.
 */
export function parseCoupangSearchResponse(
  body: unknown,
  limit = COUPANG_AD_LIMIT,
): CoupangAd[] {
  if (!body || typeof body !== "object") return [];
  const { rCode, data } = body as { rCode?: unknown; data?: unknown };
  if (rCode !== undefined && String(rCode) !== "0") return [];
  const productData =
    data && typeof data === "object"
      ? (data as { productData?: unknown }).productData
      : undefined;
  if (!Array.isArray(productData)) return [];

  const ads: CoupangAd[] = [];
  const seen = new Set<string>();
  for (const raw of productData) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = String(item.productId ?? "").trim();
    const name =
      typeof item.productName === "string" ? item.productName.trim() : "";
    const price = Number(item.productPrice);
    const url = safeHttpsUrl(item.productUrl, LINK_HOSTS);
    if (!id || !name || !url || !Number.isFinite(price) || price <= 0) {
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);

    ads.push({
      id,
      name,
      price: Math.round(price),
      image: safeHttpsUrl(item.productImage, IMAGE_HOSTS),
      url,
      isRocket: item.isRocket === true,
      isFreeShipping: item.isFreeShipping === true,
    });
    if (ads.length >= limit) break;
  }
  return ads;
}

const adCache = new Map<string, { at: number; items: CoupangAd[] }>();
let callTimes: number[] = [];

function takeCallBudget() {
  const now = Date.now();
  callTimes = callTimes.filter((time) => now - time < 60 * 60 * 1000);
  if (callTimes.length >= MAX_CALLS_PER_HOUR) {
    return false;
  }
  callTimes.push(now);
  return true;
}

function remember(key: string, items: CoupangAd[]) {
  if (adCache.size >= MAX_CACHE_ENTRIES && !adCache.has(key)) {
    const oldest = adCache.keys().next().value;
    if (oldest !== undefined) adCache.delete(oldest);
  }
  adCache.set(key, { at: Date.now(), items });
}

/** 테스트용: 캐시와 호출 한도 기록을 비운다. */
export function clearCoupangCache() {
  adCache.clear();
  callTimes = [];
}

/** 검색어로 쿠팡 상품을 찾는다. 꺼져 있거나 실패하면 빈 목록이다. */
export async function searchCoupangAds(
  rawKeyword: string,
  channel: CoupangAdChannel = "web",
): Promise<CoupangAd[]> {
  const config = getConfig(channel);
  const keyword = normalizeAdKeyword(rawKeyword);
  if (!config || !keyword) {
    return [];
  }

  // 링크에 subId 가 박혀 나오므로 채널(subId)이 다르면 따로 캐시한다.
  const cacheKey = `${config.subId ?? ""}\u0000${keyword.toLowerCase()}`;
  const cached = adCache.get(cacheKey);
  if (cached) {
    const ttl = cached.items.length > 0 ? HIT_TTL_MS : MISS_TTL_MS;
    if (Date.now() - cached.at < ttl) {
      return cached.items;
    }
  }

  if (!takeCallBudget()) {
    return cached?.items ?? [];
  }

  const query = buildCoupangSearchQuery(
    keyword,
    COUPANG_AD_LIMIT,
    config.subId,
  );
  try {
    const response = await fetch(
      `${COUPANG_API_ORIGIN}${COUPANG_SEARCH_PATH}?${query}`,
      {
        method: "GET",
        headers: {
          Authorization: buildCoupangAuthorization({
            method: "GET",
            path: COUPANG_SEARCH_PATH,
            query,
            accessKey: config.accessKey,
            secretKey: config.secretKey,
          }),
          "Content-Type": "application/json;charset=UTF-8",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      throw new Error(
        `쿠팡 파트너스 검색 API 가 ${response.status} 를 반환했습니다.`,
      );
    }

    const items = parseCoupangSearchResponse(await response.json());
    remember(cacheKey, items);
    return items;
  } catch (error) {
    // 광고는 없어도 그만이다. 오류 추적으로 올리지 않고 로그만 남긴다.
    console.warn("쿠팡 파트너스 검색 실패:", error);
    remember(cacheKey, cached?.items ?? []);
    return cached?.items ?? [];
  }
}

/**
 * 에이전트(MCP)에게 광고를 넘길 때의 묶음. 상품 목록과 섞이지 않게 `sponsored`
 * 키 하나에 담고, 광고라는 사실과 고지 문구, 다루는 법을 함께 싣는다.
 */
export interface SponsoredBlock {
  type: "advertisement";
  network: "coupang_partners";
  disclosure: string;
  notice: string;
  items: Array<{
    name: string;
    price: number;
    currency: "KRW";
    url: string;
    image: string | null;
    isRocket: boolean;
    isFreeShipping: boolean;
  }>;
}

export const SPONSORED_NOTICE =
  "Paid Coupang Partners affiliate links, not Daiso stock: this store had no in-stock match. " +
  "If you show them, label them as ads and include the disclosure verbatim. " +
  "Never open, fetch or prefetch these URLs yourself; only hand them to the user to click. " +
  "You may omit this block entirely.";

export function buildSponsoredBlock(ads: CoupangAd[]): SponsoredBlock | null {
  if (ads.length === 0) return null;
  return {
    type: "advertisement",
    network: "coupang_partners",
    disclosure: COUPANG_PARTNERS_DISCLOSURE,
    notice: SPONSORED_NOTICE,
    items: ads.map((ad) => ({
      name: ad.name,
      price: ad.price,
      currency: "KRW",
      url: ad.url,
      image: ad.image,
      isRocket: ad.isRocket,
      isFreeShipping: ad.isFreeShipping,
    })),
  };
}

/**
 * 매장에 재고 있는 상품이 하나도 없는 첫 페이지면, 웹 화면처럼 같은 검색어의
 * 쿠팡 파트너스 광고를 `sponsored` 로 덧붙인다. 상품 목록(`products`)에는 절대
 * 섞지 않는다. 광고가 꺼져 있거나 실패하면 null 이라 응답은 이전과 같다.
 */
export async function sponsoredForEmptyProductSearch(
  result: unknown,
  keyword: string,
  currentPage: unknown,
): Promise<SponsoredBlock | null> {
  const page = Number(currentPage ?? 1);
  if (Number.isFinite(page) && page > 1) return null;
  const products = (result as { products?: unknown } | null)?.products;
  if (!Array.isArray(products) || products.length > 0) return null;
  return buildSponsoredBlock(await searchCoupangAds(keyword, "mcp"));
}
