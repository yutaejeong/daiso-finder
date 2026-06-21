import { NextRequest } from "next/server";
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
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/ms/msg/selStr`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: "",
        curLttd: lat,
        curLitd: lng,
        geolocationAgrYn: "Y",
        srchBassPkupStrYn: "Y",
        srchYn: "N",
        currentPage: 1,
        pageSize: MAX_NEARBY_BRANCHES,
      }),
    },
  );

  if (!response.ok) {
    return [];
  }

  const data: BranchResponse = await response.json();
  return data.data ?? [];
}

async function fetchStock(
  pdNo: string,
  branchCodes: string[],
): Promise<Map<string, number>> {
  const stockByBranch = new Map<string, number>();

  if (branchCodes.length === 0) {
    return stockByBranch;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/pdo/selOfflStrStck`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        branchCodes.map((strCd) => ({ pdNo, strCd })),
      ),
    },
  );

  if (!response.ok) {
    return stockByBranch;
  }

  const data: ProductStockResponse = await response.json();

  for (const item of data.data ?? []) {
    const stock = parseInt(item.stck);
    stockByBranch.set(item.strCd, isNaN(stock) ? 0 : stock);
  }

  return stockByBranch;
}

async function fetchPlacement(
  pdNo: string,
  branchCode: string,
): Promise<{ stairNo: number | null; zoneNo: number | null }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/pdo/selPdStDispInfo`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdNo, strCd: branchCode }),
      },
    );

    if (!response.ok) {
      return { stairNo: null, zoneNo: null };
    }

    const data: ProductEquippingResponse = await response.json();
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
    const branchCode = searchParams.get("branchCode");

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
