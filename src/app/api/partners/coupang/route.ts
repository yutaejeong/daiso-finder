import { getOnlyMethodNotAllowed, internalError } from "@/lib/apiError";
import { getFixedCoupangAds } from "@/lib/coupangFixedAds";
import {
  COUPANG_PARTNERS_DISCLOSURE,
  type CoupangAdList,
  isCoupangPartnersEnabled,
  searchCoupangAds,
} from "@/lib/coupangPartners";

export const dynamic = "force-dynamic";

/**
 * 매장 상품 검색이 0건일 때 같은 검색어로 보여줄 쿠팡 파트너스 광고.
 * 웹 화면 전용이라(`/api/views`, `/api/popular/*` 처럼) OpenAPI 문서, `/api` 목록,
 * MCP, 샌드박스에는 넣지 않는다. 광고는 부가 요소라 꺼져 있거나 쿠팡이 실패해도
 * 오류 대신 빈 목록을 돌려준다.
 *
 * Open API 키가 없으면(파트너스 최종 승인 전) 검색어와 무관한 고정 링크
 * (`src/lib/coupangFixedAds.ts`)를 `kind: "fixed"` 로 돌려준다.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (!isCoupangPartnersEnabled()) {
      const body: CoupangAdList = {
        kind: "fixed",
        items: getFixedCoupangAds(),
        disclosure: COUPANG_PARTNERS_DISCLOSURE,
      };
      return Response.json(body, {
        headers: { "Cache-Control": "public, s-maxage=600" },
      });
    }

    const items = await searchCoupangAds(searchParams.get("keyword") ?? "");
    const body: CoupangAdList = {
      kind: "search",
      items,
      disclosure: COUPANG_PARTNERS_DISCLOSURE,
    };

    return Response.json(body, {
      headers: {
        // 검색 API 는 시간당 호출 한도가 작아 CDN 에서도 검색어별로 오래 둔다.
        "Cache-Control":
          items.length > 0
            ? "public, s-maxage=21600, stale-while-revalidate=86400"
            : "public, s-maxage=600",
      },
    });
  } catch (error) {
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
