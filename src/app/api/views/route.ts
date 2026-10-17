import { NextRequest, userAgent } from "next/server";
import { apiErrorResponse, methodNotAllowed } from "@/lib/apiError";
import { logView, parseViewLogEntry } from "@/lib/searchLog";

export const dynamic = "force-dynamic";

const noContent = () =>
  new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/**
 * 웹 UI 가 매장·상품 상세 화면을 열면 `navigator.sendBeacon` 으로 부르는 조회
 * 기록용 엔드포인트(`src/lib/viewBeacon.ts`). 인기 매장·인기 상품 집계의 원천이다.
 * 에이전트용 API 가 아니라서 OpenAPI 문서와 `/api` 목록에는 넣지 않는다.
 *
 * API 응답을 세지 않고 따로 받는 이유: 상세 화면의 React Query 는 창에 다시
 * 포커스가 올 때마다 재요청하므로, 응답 수는 조회 수보다 훨씬 부풀려진다.
 */
export async function POST(request: NextRequest) {
  // 다른 사이트에서 브라우저로 쏜 요청과 검색엔진 크롤러의 렌더링은 조회가 아니다.
  // User-Agent 는 판별에만 쓰고 기록하지 않는다.
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    userAgent(request).isBot
  ) {
    return noContent();
  }

  let body: unknown = null;
  try {
    body = JSON.parse(await request.text());
  } catch {
    body = null;
  }

  const entry = parseViewLogEntry(body);
  if (!entry) {
    return apiErrorResponse({
      status: 400,
      code: "invalid_parameter",
      error: "조회 기록 형식이 올바르지 않습니다.",
      message:
        "Expected a JSON body with `type` (branch_view | product_view), `branchCode`, and `productId` for product views.",
      hint: 'Send {"type":"branch_view","branchCode":"11199"} or {"type":"product_view","branchCode":"11199","productId":"1019373"}.',
    });
  }

  logView(entry);

  return noContent();
}

const postOnly = (request: Request) => methodNotAllowed(request, ["POST"]);

export const GET = postOnly;
export const PUT = postOnly;
export const PATCH = postOnly;
export const DELETE = postOnly;
