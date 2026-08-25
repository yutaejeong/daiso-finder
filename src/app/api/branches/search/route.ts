import { BranchResponse } from "../types";
import { selStr } from "@/generated/daiso/client";
import { DaisoApiError } from "@/lib/daisoApiClient";
import { internalError, missingParameter, upstreamError } from "@/lib/apiError";

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
      return missingParameter(
        "검색어를 입력하거나 위치 검색을 시도해주세요.",
        "Either `keyword` or both `curLttd` and `curLitd` must be supplied.",
        "Retry with ?keyword=강남, or with ?curLttd=37.4972&curLitd=127.0279 for a nearby search.",
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
      return upstreamError(
        "매장 검색 중 오류가 발생했습니다.",
        error.status,
        error.detail,
        "Verify the query parameters, then retry after a short delay. The upstream Daiso service is occasionally unavailable.",
      );
    }

    console.error("API 오류:", error);
    return internalError(
      error,
      "Retry the request. If it keeps failing, report the `detail` field at https://github.com/yutaejeong/daiso-finder/issues.",
    );
  }
}
