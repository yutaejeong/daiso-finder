import { getOnlyMethodNotAllowed } from "@/lib/apiError";
import { checkDaisoHealth } from "@/lib/daisoHealth";

export const dynamic = "force-dynamic";

/**
 * 다이소 상류 점검용. Sentry 업타임 모니터가 주기적으로 부르고, 503 이
 * 이어지면 이슈를 열어 알린다(`docs/sentry.md`). 에이전트용 API 가 아니라서
 * OpenAPI 문서와 `/api` 목록에는 넣지 않는다.
 */
export async function GET() {
  const result = await checkDaisoHealth();

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 503,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const POST = getOnlyMethodNotAllowed;
export const PUT = getOnlyMethodNotAllowed;
export const PATCH = getOnlyMethodNotAllowed;
export const DELETE = getOnlyMethodNotAllowed;
