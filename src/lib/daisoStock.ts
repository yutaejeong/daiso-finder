import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type {
  ProductEquippingResponse,
  ProductStockResponse,
} from "@/app/api/products/types";
import {
  DaisoApiError,
  daisoFetch,
  getDaisoApiBaseUrl,
} from "@/lib/daisoApiClient";

/**
 * 다이소는 매장 재고·진열 위치 조회를 사전 인증 뒤로 옮겼다. 예전
 * `/pdo/selOfflStrStck`·`/pdo/selPdStDispInfo` 는 무엇을 보내도 500 을 돌려주고,
 * 공개 OpenAPI 명세(`/v3/api-docs`)도 내려가 orval 로 다시 생성할 수 없어 손으로 쓴다.
 *
 * 다이소몰 웹의 `postWithAuth` 와 같은 순서를 따른다.
 * 1. `GET /auth/request` 가 본문으로 JWT 를, `X-DM-UID` 헤더로 요청 ID 를 준다.
 *    JWT 는 요청한 IP·User-Agent 에 묶이고 30초 뒤 만료된다.
 * 2. JWT 를 AES-128-CBC(키 "PRE_AUTH_ENC_KEY", 임의 IV)로 암호화해
 *    `Bearer base64(IV) + base64(암호문)` 으로 보낸다(CryptoJS 기본값과 같은 형식).
 */
export const DAISO_STOCK_PATH = "/pd/pdh/selStrPkupStck";
export const DAISO_DISPLAY_PATH = "/pdo/selIntPdStDispInfo";

const PRE_AUTH_KEY = Buffer.from("PRE_AUTH_ENC_KEY", "utf8");

/** 토큰은 30초 유효하다. 요청 도중 만료되지 않도록 여유를 두고 버린다. */
const TOKEN_REUSE_MS = 20_000;

type PreAuthHeaders = { Authorization: string; "X-DM-UID": string };

let cachedHeaders: { headers: PreAuthHeaders; expiresAt: number } | null =
  null;
let pendingHeaders: Promise<PreAuthHeaders> | null = null;

export function encryptPreAuthToken(token: string, iv = randomBytes(16)) {
  const cipher = createCipheriv("aes-128-cbc", PRE_AUTH_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}${encrypted.toString("base64")}`;
}

/** 테스트용: `encryptPreAuthToken` 의 역연산. */
export function decryptPreAuthToken(value: string) {
  // 16바이트 IV 의 base64 는 패딩까지 항상 24자다.
  const iv = Buffer.from(value.slice(0, 24), "base64");
  const decipher = createDecipheriv("aes-128-cbc", PRE_AUTH_KEY, iv);
  return Buffer.concat([
    decipher.update(Buffer.from(value.slice(24), "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function requestPreAuthHeaders(): Promise<PreAuthHeaders> {
  const response = await fetch(
    new URL("/auth/request", getDaisoApiBaseUrl()),
    { cache: "no-store" },
  );
  const token = (await response.text()).trim();
  const uid = response.headers.get("x-dm-uid");

  if (!response.ok || !token || !uid) {
    throw new DaisoApiError(
      "Daiso API 인증에 실패했습니다.",
      response.ok ? 502 : response.status,
      `GET /auth/request answered HTTP ${response.status}${uid ? "" : " without X-DM-UID"}`,
    );
  }

  return {
    Authorization: `Bearer ${encryptPreAuthToken(token)}`,
    "X-DM-UID": uid,
  };
}

/** 한 검색이 진열 조회를 동시에 여러 번 보내므로 토큰 발급을 하나로 모은다. */
async function getPreAuthHeaders(): Promise<PreAuthHeaders> {
  if (cachedHeaders && cachedHeaders.expiresAt > Date.now()) {
    return cachedHeaders.headers;
  }

  pendingHeaders ??= requestPreAuthHeaders()
    .then((headers) => {
      cachedHeaders = { headers, expiresAt: Date.now() + TOKEN_REUSE_MS };
      return headers;
    })
    .finally(() => {
      pendingHeaders = null;
    });

  return pendingHeaders;
}

export function resetPreAuthCache() {
  cachedHeaders = null;
  pendingHeaders = null;
}

function isAuthRejection(error: unknown) {
  return (
    error instanceof DaisoApiError &&
    (error.status === 401 || error.status === 403)
  );
}

async function postWithPreAuth<T>(path: string, body: unknown): Promise<T> {
  const send = async () =>
    daisoFetch<T>(path, {
      method: "POST",
      headers: await getPreAuthHeaders(),
      body,
      cache: "no-store",
    });

  try {
    return await send();
  } catch (error) {
    // 캐시한 토큰이 먼저 만료됐거나 서버 인스턴스의 IP 가 바뀐 경우 한 번만 새로 받는다.
    if (!isAuthRejection(error)) throw error;
    resetPreAuthCache();
    return send();
  }
}

/** 여러 (상품, 매장) 쌍의 매장 재고. 다이소가 모르는 상품은 응답에서 빠진다. */
export function selStoreStock(items: { pdNo: string; strCd: string }[]) {
  return postWithPreAuth<ProductStockResponse>(DAISO_STOCK_PATH, items);
}

/** 한 매장 안에서 상품이 진열된 층·구역. */
export function selStoreDisplay(item: { pdNo: string; strCd: string }) {
  return postWithPreAuth<ProductEquippingResponse>(DAISO_DISPLAY_PATH, item);
}
