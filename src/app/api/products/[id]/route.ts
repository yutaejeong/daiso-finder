import { NextRequest } from "next/server";
import {
  selOfflStrStckList,
  selPdStDispInfo,
  selStr,
} from "@/generated/daiso/client";
import { Branch, BranchResponse } from "../../branches/types";
import {
  OtherBranchStock,
  ProductDetailResponse,
  ProductEquippingResponse,
  ProductStockResponse,
} from "../types";

const MAX_NEARBY_BRANCHES = 50;
const MAX_OTHER_BRANCHES = 20;

async function fetchNearbyBranches(
  lat: number,
  lng: number,
): Promise<Branch[]> {
  try {
    const payload: Parameters<typeof selStr>[0] & { srchYn?: string } = {
      keyword: "",
      curLttd: lat,
      curLitd: lng,
      geolocationAgrYn: "Y",
      srchBassPkupStrYn: "Y",
      srchYn: "N",
      currentPage: 1,
      pageSize: MAX_NEARBY_BRANCHES,
    };
    const data = (await selStr(payload)) as unknown as BranchResponse;

    return data.data ?? [];
  } catch {
    return [];
  }
}

async function fetchStock(
  pdNo: string,
  branchCodes: string[],
): Promise<Map<string, number>> {
  const stockByBranch = new Map<string, number>();

  if (branchCodes.length === 0) {
    return stockByBranch;
  }

  try {
    const data = (await selOfflStrStckList(
      branchCodes.map((strCd) => ({ pdNo, strCd })),
    )) as unknown as ProductStockResponse;

    for (const item of data.data ?? []) {
      const stock = parseInt(item.stck);
      stockByBranch.set(item.strCd, isNaN(stock) ? 0 : stock);
    }

    return stockByBranch;
  } catch {
    return stockByBranch;
  }
}

async function fetchPlacement(
  pdNo: string,
  branchCode: string,
): Promise<{ stairNo: number | null; zoneNo: number | null }> {
  try {
    const data = (await selPdStDispInfo({
      pdNo,
      strCd: branchCode,
    })) as unknown as ProductEquippingResponse;
    const placement = data.data?.[0];

    if (!placement) {
      return { stairNo: null, zoneNo: null };
    }

    const stairNo = parseInt(placement.stairNo);
    const zoneNo = parseInt(placement.zoneNo);

    return {
      stairNo: isNaN(stairNo) ? null : stairNo,
      zoneNo: isNaN(zoneNo) ? null : zoneNo,
    };
  } catch (error) {
    console.error("진열 정보 조회 오류:", error);
    return { stairNo: null, zoneNo: null };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const pdNo = params.id;
    const { searchParams } = new URL(request.url);
    const branchCode =
      searchParams.get("branchCode") ?? searchParams.get("branchCd");

    if (!pdNo) {
      return new Response(
        JSON.stringify({ error: "상품 정보가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!branchCode) {
      return new Response(
        JSON.stringify({ error: "매장 정보가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { fetchBranchByCode } = await import("@/lib/daisoBranches");
    const currentBranch = await fetchBranchByCode(branchCode);

    const nearbyBranches = currentBranch
      ? await fetchNearbyBranches(currentBranch.lat, currentBranch.lng)
      : [];

    // 현재 지점 + 주변 지점의 재고를 한 번에 조회
    const candidateCodes = Array.from(
      new Set([branchCode, ...nearbyBranches.map((b) => b.strCd)]),
    );

    const [stockByBranch, placement] = await Promise.all([
      fetchStock(pdNo, candidateCodes),
      fetchPlacement(pdNo, branchCode),
    ]);

    const otherBranches: OtherBranchStock[] = nearbyBranches
      .filter((branch) => branch.strCd !== branchCode)
      .map((branch) => ({
        code: branch.strCd,
        name: branch.strNm,
        address: branch.strAddr,
        stock: stockByBranch.get(branch.strCd) ?? 0,
        distanceKm: typeof branch.km === "number" ? branch.km : null,
      }))
      .filter((branch) => branch.stock > 0)
      .slice(0, MAX_OTHER_BRANCHES);

    const result: ProductDetailResponse = {
      stock: stockByBranch.get(branchCode) ?? 0,
      stairNo: placement.stairNo,
      zoneNo: placement.zoneNo,
      otherBranches,
    };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API 오류:", error);
    return new Response(
      JSON.stringify({
        error: "서버 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
