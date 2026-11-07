/**
 * 인기 매장·인기 상품. 조회 행(`src/lib/searchLog.ts`)을 Apps Script 가 매시간
 * 세어 `popular` 시트에 적어 두고(`docs/apps-script/Code.gs`), 여기서는 그
 * 집계를 웹훅으로 읽어 화면에 보일 모양으로 바꾼다. 설정은 `docs/search-logs.md`.
 *
 * 집계에는 매장 코드와 상품 번호만 쓴다. 조회 기록은 누구나 `POST /api/views`
 * 로 보낼 수 있는 값이라, 시트에 적힌 상품명은 믿지 않고 상품 번호로 다이소에서
 * 다시 조회한 이름·가격·이미지를 보여준다.
 *
 * 인기 순위는 부가 기능이다. 웹훅이 꺼져 있거나 느리거나 실패하면 빈 목록을
 * 돌려줄 뿐 화면을 막지 않는다.
 */

import type { SimplifiedBranch } from "@/app/api/branches/types";
import type { SimplifiedProductInfo } from "@/app/api/products/types";

export interface PopularBranch {
  code: string;
  name: string;
  address: string;
  /** 집계 기간 동안 매장 상세 화면을 연 세션 수 */
  views: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  /** 집계 기간 동안 상품 상세 화면을 연 세션 수 */
  views: number;
  /** 눌렀을 때 갈 매장. 매장별 목록이면 요청한 매장, 전체 목록이면 가장 많이 본 매장 */
  branchCode: string;
}

export interface PopularList<T> {
  /** 집계에 쓴 기간(일). 집계가 아직 없으면 null. */
  windowDays: number | null;
  /** Apps Script 가 집계를 마친 시각. 집계가 아직 없으면 null. */
  updatedAt: string | null;
  items: T[];
}

/** Apps Script `readPopular()` 가 돌려주는 집계 한 줄 */
export interface PopularEntry {
  branchCode: string;
  productId?: string;
  views: number;
}

export interface PopularSnapshot {
  generatedAt: string | null;
  windowDays: number;
  branches: PopularEntry[];
  products: PopularEntry[];
  branchProducts: PopularEntry[];
}

/**
 * 이 조회 수 미만은 순위에 올리지 않는다. 한두 번의 우연한 조회나 장난으로
 * 보낸 요청이 "인기" 로 보이지 않게 하는 최소한의 문턱이다.
 */
export const MIN_POPULAR_VIEWS = 2;

export const MAX_POPULAR_LIMIT = 20;
export const DEFAULT_POPULAR_LIMIT = 10;

const WEBHOOK_TIMEOUT_MS = 8000;

/** 집계는 매시간 갱신되므로 서버 안에서도 잠깐은 같은 결과를 재사용한다. */
const CACHE_TTL_MS = 10 * 60 * 1000;

function getWebhookConfig() {
  const url = process.env.SEARCH_LOG_WEBHOOK_URL?.trim();
  if (!url) {
    return null;
  }
  return { url, token: process.env.SEARCH_LOG_WEBHOOK_TOKEN?.trim() ?? "" };
}

/** 웹훅이 설정되어 있어야 인기 순위를 읽을 수 있다. */
export function isPopularEnabled() {
  return getWebhookConfig() !== null;
}

/** `limit` 쿼리를 1~MAX_POPULAR_LIMIT 로 맞춘다. 숫자가 아니면 기본값. */
export function parsePopularLimit(value: string | null): number {
  const parsed = Number(value);
  if (value === null || value.trim() === "" || !Number.isFinite(parsed)) {
    return DEFAULT_POPULAR_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_POPULAR_LIMIT);
}

function isEntry(value: unknown): value is PopularEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.branchCode === "string" &&
    entry.branchCode !== "" &&
    typeof entry.views === "number" &&
    Number.isFinite(entry.views) &&
    (entry.productId === undefined || typeof entry.productId === "string")
  );
}

/** 웹훅 응답을 믿지 않고 모양을 확인한다. 어긋나면 null. */
export function parsePopularSnapshot(body: unknown): PopularSnapshot | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (record.ok !== true) {
    return null;
  }

  const list = (value: unknown) =>
    Array.isArray(value) ? value.filter(isEntry) : [];

  return {
    generatedAt:
      typeof record.generatedAt === "string" ? record.generatedAt : null,
    windowDays: typeof record.windowDays === "number" ? record.windowDays : 30,
    branches: list(record.branches),
    products: list(record.products),
    branchProducts: list(record.branchProducts),
  };
}

/** 캐시 키는 요청이 정하는 값(매장 코드)이라, 무한히 늘지 않도록 상한을 둔다. */
const MAX_CACHE_ENTRIES = 300;

/**
 * 캐시에 빠진 요청이 Apps Script 를 부르는 횟수의 상한(인스턴스당, 분당).
 * 매장 코드를 바꿔 가며 캐시를 피하는 요청이 웹앱의 동시 실행 한도를 먹어
 * 검색·조회 기록 쓰기까지 막는 일을 막는다. 넘으면 예전 집계나 빈 목록을 쓴다.
 */
const MAX_WEBHOOK_CALLS_PER_MINUTE = 60;
let webhookCallTimes: number[] = [];

function takeWebhookBudget() {
  const now = Date.now();
  webhookCallTimes = webhookCallTimes.filter((time) => now - time < 60_000);
  if (webhookCallTimes.length >= MAX_WEBHOOK_CALLS_PER_MINUTE) {
    return false;
  }
  webhookCallTimes.push(now);
  return true;
}

function remember<V>(cache: Map<string, V>, key: string, value: V) {
  if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(key)) {
    // Map 은 넣은 순서를 지키므로 첫 키가 가장 오래된 항목이다.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, value);
}

const snapshotCache = new Map<
  string,
  { at: number; snapshot: PopularSnapshot }
>();

/** 테스트에서 캐시와 호출 횟수를 되돌릴 때 쓴다. */
export function clearPopularCache() {
  snapshotCache.clear();
  resolvedCache.clear();
  webhookCallTimes = [];
}

/**
 * Apps Script 웹앱에서 집계를 읽는다. 매장을 주면 그 매장의 인기 상품도 담긴다.
 * 설정이 없거나 요청이 실패하면 null — 실패했을 때 예전 집계가 있으면 그걸 쓴다.
 */
export async function fetchPopularSnapshot(
  branchCode?: string,
): Promise<PopularSnapshot | null> {
  const config = getWebhookConfig();
  if (!config) {
    return null;
  }

  const cacheKey = branchCode ?? "";
  const cached = snapshotCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.snapshot;
  }

  if (!takeWebhookBudget()) {
    return cached?.snapshot ?? null;
  }

  try {
    // 토큰이 주소에 남지 않도록 쓰기와 같이 POST 본문으로 보낸다.
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: config.token,
        action: "popular",
        ...(branchCode ? { branchCode } : {}),
      }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`인기 순위 웹훅이 ${response.status} 를 반환했습니다.`);
    }

    const snapshot = parsePopularSnapshot(await response.json());
    if (!snapshot) {
      throw new Error("인기 순위 웹훅 응답 형태가 올바르지 않습니다.");
    }

    remember(snapshotCache, cacheKey, { at: Date.now(), snapshot });
    return snapshot;
  } catch (error) {
    console.error("인기 순위 조회 실패:", error);
    return cached?.snapshot ?? null;
  }
}

interface PopularLookups {
  fetchBranch: (code: string) => Promise<SimplifiedBranch | null>;
  fetchProduct: (id: string) => Promise<SimplifiedProductInfo | null>;
}

async function defaultLookups(): Promise<PopularLookups> {
  const [{ fetchBranchByCode }, { fetchProductById }] = await Promise.all([
    import("@/lib/daisoBranches"),
    import("@/lib/daisoProducts"),
  ]);
  return { fetchBranch: fetchBranchByCode, fetchProduct: fetchProductById };
}

function topEntries(entries: PopularEntry[], limit: number) {
  return entries
    .filter((entry) => entry.views >= MIN_POPULAR_VIEWS)
    .slice(0, limit);
}

/** 다이소에서 이름을 못 찾았거나 조회가 실패한 항목은 빼고 순서를 지킨다. */
async function resolveAll<T, R>(
  entries: T[],
  resolve: (entry: T) => Promise<R | null>,
): Promise<R[]> {
  const settled: (R | null)[] = await Promise.all(
    entries.map(async (entry) => {
      try {
        return await resolve(entry);
      } catch {
        return null;
      }
    }),
  );
  return settled.filter((item): item is R => item !== null);
}

/**
 * 인기 매장. 순위는 집계가 정하고, 이름·주소는 다이소 매장 조회로 채운다.
 * 폐점해서 조회되지 않는 매장은 목록에서 빠진다.
 */
export async function buildPopularBranches(
  snapshot: PopularSnapshot | null,
  limit: number,
  lookups?: Pick<PopularLookups, "fetchBranch">,
): Promise<PopularList<PopularBranch>> {
  if (!snapshot) {
    return { windowDays: null, updatedAt: null, items: [] };
  }

  const { fetchBranch } = lookups ?? (await defaultLookups());
  // 조회가 안 되는 매장이 섞여도 limit 개를 채우도록 조금 넉넉히 읽는다.
  const candidates = topEntries(snapshot.branches, limit + 5);
  const items = await resolveAll(candidates, async (entry) => {
    const branch = await fetchBranch(entry.branchCode);
    return branch
      ? {
          code: branch.code,
          name: branch.name,
          address: branch.address,
          views: entry.views,
        }
      : null;
  });

  return {
    windowDays: snapshot.windowDays,
    updatedAt: snapshot.generatedAt,
    items: items.slice(0, limit),
  };
}

/**
 * 인기 상품. `branchCode` 가 있으면 그 매장에서 많이 본 상품, 없으면 전체에서
 * 많이 본 상품(각 상품은 가장 많이 본 매장과 함께)이다. 이름·가격·이미지는
 * 상품 번호로 다이소에서 다시 조회한다.
 */
export async function buildPopularProducts(
  snapshot: PopularSnapshot | null,
  limit: number,
  branchCode?: string,
  lookups?: Pick<PopularLookups, "fetchProduct">,
): Promise<PopularList<PopularProduct>> {
  if (!snapshot) {
    return { windowDays: null, updatedAt: null, items: [] };
  }

  const { fetchProduct } = lookups ?? (await defaultLookups());
  const source = branchCode ? snapshot.branchProducts : snapshot.products;
  const candidates = topEntries(
    source.filter((entry) => entry.productId),
    limit + 5,
  );
  const items = await resolveAll(candidates, async (entry) => {
    const product = await fetchProduct(entry.productId as string);
    return product
      ? {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          views: entry.views,
          branchCode: branchCode ?? entry.branchCode,
        }
      : null;
  });

  return {
    windowDays: snapshot.windowDays,
    updatedAt: snapshot.generatedAt,
    items: items.slice(0, limit),
  };
}

const resolvedCache = new Map<string, { at: number; value: unknown }>();

/**
 * 이름 조회까지 끝낸 결과를 잠깐 재사용한다. 요청마다 다이소 API 를 열 번씩
 * 부르지 않기 위해서다. 성공(집계가 있는)한 결과만 담는다.
 */
export async function cachedResolved<T>(
  key: string,
  build: () => Promise<PopularList<T>>,
): Promise<PopularList<T>> {
  const cached = resolvedCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value as PopularList<T>;
  }
  const value = await build();
  if (value.updatedAt !== null) {
    remember(resolvedCache, key, { at: Date.now(), value });
  }
  return value;
}
