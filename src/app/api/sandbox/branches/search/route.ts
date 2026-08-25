import { missingParameter } from "@/lib/apiError";
import { filterSandboxStores, SANDBOX_STORES } from "@/lib/sandboxFixtures";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const hasLocation = Boolean(
    searchParams.get("curLttd") && searchParams.get("curLitd"),
  );

  if (!keyword.trim() && !hasLocation) {
    return missingParameter(
      "검색어를 입력하거나 위치 검색을 시도해주세요.",
      "Either `keyword` or both `curLttd` and `curLitd` must be supplied.",
      "Retry with ?keyword=강남, or with ?curLttd=37.4972&curLitd=127.0279 for a nearby search.",
    );
  }

  const stores = hasLocation ? SANDBOX_STORES : filterSandboxStores(keyword);

  return Response.json(stores, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
