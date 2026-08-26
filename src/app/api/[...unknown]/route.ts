import { apiErrorResponse } from "@/lib/apiError";

export const dynamic = "force-dynamic";

/**
 * `/api` 아래에서 매칭되지 않은 모든 경로. Next 기본 404 는 HTML 이라
 * 에이전트가 파싱할 수 없으므로 구조화된 JSON 으로 대신 응답한다.
 */
function routeNotFound(request: Request) {
  const { pathname, origin } = new URL(request.url);

  return apiErrorResponse({
    status: 404,
    code: "route_not_found",
    error: "요청한 API 경로를 찾을 수 없습니다.",
    message: `No API route matches ${request.method} ${pathname}.`,
    hint: `List every available operation at ${origin}/api, or read the OpenAPI document at ${origin}/openapi.json.`,
  });
}

export const GET = routeNotFound;
export const POST = routeNotFound;
export const PUT = routeNotFound;
export const PATCH = routeNotFound;
export const DELETE = routeNotFound;
export const HEAD = routeNotFound;
export const OPTIONS = routeNotFound;
