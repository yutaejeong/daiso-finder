import { openApiJsonResponse } from "@/lib/openapiResponses";

export function GET(request: Request) {
  return openApiJsonResponse(request);
}
