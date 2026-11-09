import {
  apiErrorResponse,
  getOnlyMethodNotAllowed,
  internalError,
} from "@/lib/apiError";
import {
  buildPopularProducts,
  cachedResolved,
  fetchPopularSnapshot,
  parsePopularLimit,
} from "@/lib/popular";
import { CODE_PATTERN } from "@/lib/searchLog";

export const dynamic = "force-dynamic";

/**
 * 최근 많이 본 상품. `branchCode` 를 주면 그 매장에서, 없으면 전체에서 센다.
 * 매장 화면의 "이 매장에서 많이 찾는 상품" 이 쓴다. 집계가 없거나 읽지 못하면
 * 빈 목록(`updatedAt: null`)이다. 에이전트용 공개 API 가 아니라서 OpenAPI 문서와
 * `/api` 목록에는 넣지 않는다.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parsePopularLimit(searchParams.get("limit"));
    const branchCode = searchParams.get("branchCode")?.trim() || undefined;

    if (branchCode && !CODE_PATTERN.test(branchCode)) {
      return apiErrorResponse({
        status: 400,
        code: "invalid_parameter",
        error: "매장 정보가 올바르지 않습니다.",
        message: "`branchCode` must be a Daiso store code (letters or digits).",
        hint: "Pass the `code` field of a store from GET /api/branches/search, or omit branchCode for the overall ranking.",
      });
    }

    const result = await cachedResolved(
      `products:${branchCode ?? ""}:${limit}`,
      async () =>
        buildPopularProducts(
          await fetchPopularSnapshot(branchCode),
          limit,
          branchCode,
        ),
    );

    return Response.json(result, {
      headers: {
        "Cache-Control":
          result.updatedAt === null
            ? "public, s-maxage=60"
            : "public, s-maxage=600, stale-while-revalidate=3600",
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
