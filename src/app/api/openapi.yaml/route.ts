import { openApiYamlResponse } from "@/lib/openapiResponses";
import { getOnlyMethodNotAllowed } from "@/lib/apiError";

export function GET(request: Request) {
  return openApiYamlResponse(request);
}

export const POST = getOnlyMethodNotAllowed;
export const PUT = getOnlyMethodNotAllowed;
export const PATCH = getOnlyMethodNotAllowed;
export const DELETE = getOnlyMethodNotAllowed;
