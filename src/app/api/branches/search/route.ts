import { BranchResponse } from "../types";
import { selStr } from "@/generated/daiso/client";
import { DaisoApiError } from "@/lib/daisoApiClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const currentPage = searchParams.get("currentPage");
    const pageSize = searchParams.get("pageSize");
    const curLttd = searchParams.get("curLttd");
    const curLitd = searchParams.get("curLitd");

    const hasLocation = curLttd && curLitd;

    if (!keyword.trim() && !hasLocation) {
      return new Response(
        JSON.stringify({
          error: "검색어를 입력하거나 위치 검색을 시도해주세요.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const payload: Parameters<typeof selStr>[0] & { srchYn?: string } = {
      keyword,
      ...(hasLocation && {
        curLttd: parseFloat(curLttd),
        curLitd: parseFloat(curLitd),
        geolocationAgrYn: "Y",
      }),
      srchBassPkupStrYn: "Y",
      srchYn: "N",
      currentPage: currentPage ? parseInt(currentPage) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    };

    const data = (await selStr(payload)) as unknown as BranchResponse;
    const branches = data.data ?? [];

    return new Response(
      JSON.stringify(
        branches.map((branch) => ({
          code: branch.strCd,
          name: branch.strNm,
          lat: branch.strLttd,
          lng: branch.strLitd,
          address: branch.strAddr,
          openTime: branch.opngTime,
          closeTime: branch.clsngTime,
        })),
      ),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    if (error instanceof DaisoApiError) {
      return new Response(
        JSON.stringify({
          error: "매장 검색 중 오류가 발생했습니다.",
          detail: error.detail,
        }),
        {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.error("API 오류:", error);
    return new Response(
      JSON.stringify({
        error: "서버 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
