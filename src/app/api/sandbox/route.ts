import { SITE_NAME_EN } from "@/lib/site";
import { getOnlyMethodNotAllowed } from "@/lib/apiError";

/** 샌드박스 루트. 어떤 픽스처가 준비돼 있는지 알려준다. */
export function GET(request: Request) {
  const base = new URL(request.url).origin;

  return Response.json(
    {
      name: `${SITE_NAME_EN} sandbox`,
      description:
        "Fixture-backed copies of the public endpoints. No API key, no upstream traffic, and stable responses you can assert against.",
      authentication: { type: "none", required: false },
      endpoints: [
        {
          method: "GET",
          path: "/api/sandbox/branches/search",
          operationId: "searchSandboxStores",
          description: "Fixture store search. Try ?keyword=강남.",
        },
        {
          method: "GET",
          path: "/api/sandbox/branches/{code}",
          operationId: "getSandboxStore",
          description:
            "Fixture store lookup. 11199 hits, anything else returns the 404 error shape.",
        },
        {
          method: "GET",
          path: "/api/sandbox/products",
          operationId: "searchSandboxStoreProducts",
          description:
            "Fixture product search. Try ?branchCode=11199&keyword=수세미.",
        },
        {
          method: "GET",
          path: "/api/sandbox/products/{id}",
          operationId: "getSandboxProductAvailability",
          description:
            "Fixture product availability. Try /1019373?branchCode=11199.",
        },
      ],
      fixtures: {
        storeCodes: ["11199", "10528", "10962"],
        productIds: ["1019373", "1024881", "1031244"],
      },
      documentation: `${base}/developers`,
    },
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
