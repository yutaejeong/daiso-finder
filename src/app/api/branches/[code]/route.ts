import { fetchBranchByCode } from "@/lib/daisoBranches";
import {
  getOnlyMethodNotAllowed,
  internalError,
  notFound,
  upstreamErrorOrNull,
} from "@/lib/apiError";

export async function GET(
  _request: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code;

  try {
    const branch = await fetchBranchByCode(code);

    if (!branch) {
      return notFound(
        "매장 정보를 찾을 수 없습니다.",
        `No Daiso store matches the store code "${code}".`,
        "Store codes come from the `code` field of GET /api/branches/search. Search for the store by name or address first.",
      );
    }

    return new Response(JSON.stringify(branch), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const upstream = upstreamErrorOrNull(
      error,
      "Verify the store code, then retry after a short delay. The upstream Daiso service is occasionally unavailable.",
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
