import { buildOpenApiDocument } from "@/lib/openapi";
import { getOnlyMethodNotAllowed } from "@/lib/apiError";
import { SITE_NAME_EN, SITE_TAGLINE_EN } from "@/lib/site";

type OperationSummary = {
  method: string;
  path: string;
  operationId: string;
  description: string;
};

function listOperations(document: ReturnType<typeof buildOpenApiDocument>) {
  const paths = document.paths as Record<
    string,
    Record<string, { operationId?: string; summary?: string }>
  >;

  const operations: OperationSummary[] = [];
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation?.operationId) continue;
      operations.push({
        method: method.toUpperCase(),
        path,
        operationId: operation.operationId,
        description: operation.summary ?? "",
      });
    }
  }

  return operations;
}

/**
 * API 루트. 에이전트가 한 번의 요청으로 전체 엔드포인트와 발견 문서를
 * 파악할 수 있도록 OpenAPI 문서에서 목록을 그대로 뽑아 내려준다.
 */
export function GET(request: Request) {
  const base = new URL(request.url).origin;
  const document = buildOpenApiDocument(base);
  const info = document.info as { version: string };

  return Response.json(
    {
      name: `${SITE_NAME_EN} API`,
      description: SITE_TAGLINE_EN,
      version: info.version,
      authentication: {
        type: "none",
        required: false,
        signup: "Not required. The API is free, keyless, and self-serve.",
      },
      endpoints: listOperations(document),
      documentation: {
        openapiJson: `${base}/openapi.json`,
        openapiYaml: `${base}/openapi.yaml`,
        developerPortal: `${base}/developers`,
        agentInstructions: `${base}/agent-instructions.md`,
        llmsTxt: `${base}/llms.txt`,
        apiCatalog: `${base}/.well-known/api-catalog`,
        mcpEndpoint: `${base}/api/mcp`,
        mcpManifest: `${base}/.well-known/mcp.json`,
        agentSkills: `${base}/.well-known/agent-skills/index.json`,
        sandbox: `${base}/api/sandbox`,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export const POST = getOnlyMethodNotAllowed;
export const PUT = getOnlyMethodNotAllowed;
export const PATCH = getOnlyMethodNotAllowed;
export const DELETE = getOnlyMethodNotAllowed;
