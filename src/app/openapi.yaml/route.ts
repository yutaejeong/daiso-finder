import { openApiYamlResponse } from "@/lib/openapiResponses";

export function GET(request: Request) {
  return openApiYamlResponse(request);
}
