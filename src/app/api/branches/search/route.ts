import { BranchResponse } from "../types";
import { selStr } from "@/generated/daiso/client";
import {
  getOnlyMethodNotAllowed,
  internalError,
  missingParameter,
  upstreamErrorOrNull,
} from "@/lib/apiError";
import { logSearch, searchLogSource } from "@/lib/searchLog";
import {
  RELAXED_KEYWORD_HEADER,
  RELAXED_STEP_HEADER,
  RelaxedSearch,
  branchRelaxCandidates,
} from "@/lib/searchQuery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // 무한 스크롤의 다음 페이지는 같은 검색의 연장이므로 첫 페이지만 기록한다.
  const isFirstPage = (searchParams.get("currentPage") ?? "1") === "1";
  const source = searchLogSource(request.headers);

  try {
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
    let branches = data.data ?? [];
    let relaxed: RelaxedSearch | null = null;

    // 점포명은 '부산양정점' 처럼 붙어 있고 '다이소' 도 없어서, 사람이 말하듯 쓴
    // 검색어는 0건이 되기 쉽다. 첫 페이지가 비면 검색어를 고쳐서 다시 찾는다.
    // 다음 페이지에서는 하지 않는다: 원래 검색어의 마지막 페이지가 비었다고
    // 다른 검색어의 결과를 이어 붙이면 안 되기 때문이다.
    if (
      branches.length === 0 &&
      isFirstPage &&
      !hasLocation &&
      searchParams.get("relax") !== "false"
    ) {
      for (const candidate of branchRelaxCandidates(keyword)) {
        const retry = (await selStr({
          ...payload,
          keyword: candidate.keyword,
        })) as unknown as BranchResponse;
        const found = retry.data ?? [];
        if (found.length > 0) {
          branches = found;
          relaxed = candidate;
          break;
        }
      }
    }

    if (isFirstPage) {
      // 결과 수는 사용자가 실제로 받은 건수다. 고쳐서 찾았어도 그 건수를 남기고,
      // 고쳤는지는 GA4(`relaxed_step`)가 따로 기록한다.
      logSearch({
        type: "branch",
        keyword,
        source,
        resultCount: branches.length,
      });
    }

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
          // 본문은 매장 배열 그대로 두고, 고쳐서 찾았다는 사실만 헤더로 알린다.
          // 헤더 값은 ASCII 만 되므로 검색어는 퍼센트 인코딩한다.
          ...(relaxed && {
            [RELAXED_KEYWORD_HEADER]: encodeURIComponent(relaxed.keyword),
            [RELAXED_STEP_HEADER]: relaxed.step,
          }),
        },
      },
    );
  } catch (error) {
    if (isFirstPage) {
      logSearch({
        type: "branch",
        keyword: searchParams.get("keyword") || "",
        source,
        status: "error",
      });
    }

    const upstream = upstreamErrorOrNull(
      error,
      "Verify the query parameters, then retry after a short delay. The upstream Daiso service is occasionally unavailable.",
      "매장 검색 중 오류가 발생했습니다.",
    );
    if (upstream) {
      return upstream;
    }

    console.error("API 오류:", error);
    return internalError(
      error,
      "Retry the request. If it keeps failing, report the `detail` field at https://github.com/yutaejeong/daiso-finder/issues.",
    );
  }
}

export const POST = getOnlyMethodNotAllowed;
export const PUT = getOnlyMethodNotAllowed;
export const PATCH = getOnlyMethodNotAllowed;
export const DELETE = getOnlyMethodNotAllowed;
