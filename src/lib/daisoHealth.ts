import { pdThumbSelSimple } from "@/generated/daiso/client";
import { DaisoApiError } from "@/lib/daisoApiClient";
import { selStoreDisplay, selStoreStock } from "@/lib/daisoStock";

/**
 * 매장 내 상품 검색이 거치는 다이소 호출을 순서대로 한 번씩 해 본다.
 * 상류 오류는 일부러 Sentry 에 올리지 않기 때문에(`upstreamError()`), 다이소가
 * API 를 바꿔 기능이 통째로 멈춰도 오류 알림으로는 알 수 없다. Sentry 업타임
 * 모니터가 `/api/health/daiso` 를 주기적으로 불러 이 결과로 장애를 판단한다.
 *
 * 재고 수량은 보지 않는다. 품절이어도 다이소는 정상이다. 응답이 성공이고
 * 모양이 예전과 같은지만 본다.
 */
export const HEALTH_KEYWORD = "건전지";
/** 강남역점. 상품이 많고 오래 운영된 매장이라 점검 기준으로 삼는다. */
export const HEALTH_BRANCH_CODE = "11199";

export type HealthStep = "search" | "stock" | "display";

export type DaisoHealthResult =
  | { ok: true; checks: Record<HealthStep, "ok">; durationMs: number }
  | {
      ok: false;
      failedStep: HealthStep;
      reason: string;
      upstreamStatus: number | null;
      durationMs: number;
    };

class ShapeError extends Error {}

function describe(error: unknown) {
  if (error instanceof DaisoApiError) {
    return `${error.message} (HTTP ${error.status}) ${error.detail}`.slice(0, 300);
  }
  return error instanceof Error ? error.message : String(error);
}

function expectDataArray(response: unknown, what: string): unknown[] {
  const body = response as { success?: unknown; data?: unknown } | undefined;
  if (body?.success !== true || !Array.isArray(body.data)) {
    throw new ShapeError(
      `${what} answered without success/data[]: ${JSON.stringify(body).slice(0, 200)}`,
    );
  }
  return body.data;
}

export async function checkDaisoHealth(): Promise<DaisoHealthResult> {
  const startedAt = Date.now();
  let step: HealthStep = "search";

  try {
    const search = await pdThumbSelSimple({
      searchText: HEALTH_KEYWORD,
      currentPage: 1,
      pageSize: 5,
    });
    const products = expectDataArray(search, "search") as { pdNo?: string }[];
    const pdNos = products.map((p) => p.pdNo).filter(Boolean) as string[];
    if (pdNos.length === 0) {
      throw new ShapeError(`search for "${HEALTH_KEYWORD}" returned no products`);
    }

    step = "stock";
    expectDataArray(
      await selStoreStock(
        pdNos.map((pdNo) => ({ pdNo, strCd: HEALTH_BRANCH_CODE })),
      ),
      "stock",
    );

    step = "display";
    expectDataArray(
      await selStoreDisplay({ pdNo: pdNos[0], strCd: HEALTH_BRANCH_CODE }),
      "display",
    );

    return {
      ok: true,
      checks: { search: "ok", stock: "ok", display: "ok" },
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      failedStep: step,
      reason: describe(error),
      upstreamStatus: error instanceof DaisoApiError ? error.status : null,
      durationMs: Date.now() - startedAt,
    };
  }
}
