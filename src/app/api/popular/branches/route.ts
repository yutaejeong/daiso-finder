import { getOnlyMethodNotAllowed, internalError } from "@/lib/apiError";
import {
  buildPopularBranches,
  cachedResolved,
  fetchPopularSnapshot,
  parsePopularLimit,
} from "@/lib/popular";

export const dynamic = "force-dynamic";

/**
 * 최근 많이 본 매장. 웹 UI 첫 화면의 "인기 매장" 이 쓴다. 집계는 매시간 갱신되므로
 * CDN 에도 잠깐 둔다. 집계가 없거나 읽지 못하면 빈 목록(`updatedAt: null`)이다.
 * 에이전트용 공개 API 가 아니라서 OpenAPI 문서와 `/api` 목록에는 넣지 않는다.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parsePopularLimit(searchParams.get("limit"));

    const result = await cachedResolved(`branches:${limit}`, async () =>
      buildPopularBranches(await fetchPopularSnapshot(), limit),
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
