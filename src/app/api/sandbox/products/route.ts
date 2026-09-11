import { getOnlyMethodNotAllowed, missingParameter } from "@/lib/apiError";
import { filterSandboxProducts, findSandboxStore } from "@/lib/sandboxFixtures";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const branchCode =
    searchParams.get("branchCode") ?? searchParams.get("branchCd");

  if (!keyword?.trim()) {
    return missingParameter(
      "상품명을 입력해주세요.",
      "The `keyword` query parameter is required and must not be blank.",
      "Retry with ?branchCode=11199&keyword=수세미.",
    );
  }

  if (!branchCode) {
    return missingParameter(
      "매장 정보가 필요합니다.",
      "The `branchCode` query parameter is required.",
      "Sandbox store codes are 11199, 10528, and 10962.",
    );
  }

  const products = findSandboxStore(branchCode)
    ? filterSandboxProducts(keyword)
    : [];

  return Response.json(
    { products, hasMore: false, nextPage: 2 },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export const POST = getOnlyMethodNotAllowed;
export const PUT = getOnlyMethodNotAllowed;
export const PATCH = getOnlyMethodNotAllowed;
export const DELETE = getOnlyMethodNotAllowed;
