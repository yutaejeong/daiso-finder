import { methodNotAllowed, missingParameter } from "@/lib/apiError";
import {
  findSandboxProduct,
  findSandboxStore,
  SANDBOX_STORES,
} from "@/lib/sandboxFixtures";

export function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const branchCode =
    new URL(request.url).searchParams.get("branchCode") ??
    new URL(request.url).searchParams.get("branchCd");

  if (!branchCode) {
    return missingParameter(
      "매장 정보가 필요합니다.",
      "The `branchCode` query parameter is required.",
      "Sandbox store codes are 11199, 10528, and 10962.",
    );
  }

  const product = findSandboxProduct(params.id);
  const currentStore = findSandboxStore(branchCode);

  if (!product || !currentStore) {
    return Response.json(
      { stock: 0, stairNo: null, zoneNo: null, otherBranches: [] },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const otherBranches = SANDBOX_STORES.filter(
    (store) => store.code !== branchCode,
  ).map((store, index) => ({
    code: store.code,
    name: store.name,
    address: store.address,
    stock: Math.max(1, product.stock - index - 1),
    distanceKm: Number((1.2 + index * 1.7).toFixed(1)),
  }));

  return Response.json(
    {
      stock: product.stock,
      stairNo: product.stairNo,
      zoneNo: product.zoneNo,
      otherBranches,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

const rejectUnsupportedMethod = (request: Request) =>
  methodNotAllowed(request, ["GET", "HEAD", "OPTIONS"]);

export const POST = rejectUnsupportedMethod;
export const PUT = rejectUnsupportedMethod;
export const PATCH = rejectUnsupportedMethod;
export const DELETE = rejectUnsupportedMethod;
