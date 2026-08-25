import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS } from "@/lib/mcpTools";

export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  return NextResponse.json(
    {
      serverInfo: {
        name: "daiso-finder",
        version: "1.0.0",
        title: "Daiso Finder",
        description: "다이소 매장 및 상품 재고 검색 MCP 서버",
      },
      endpoint: `${base}/api/mcp`,
      transport: "streamable-http",
      protocol: "JSON-RPC 2.0 over Streamable HTTP",
      protocolVersion: "2025-06-18",
      manifest: `${base}/.well-known/mcp.json`,
      authentication: { type: "none", required: false },
      capabilities: { tools: { listChanged: false } },
      tools: MCP_TOOLS.map((tool) => tool.name),
      docs: {
        developerPortal: `${base}/developers`,
        openapi: `${base}/openapi.json`,
        llms: `${base}/llms.txt`,
        apiCatalog: `${base}/.well-known/api-catalog`,
        skills: `${base}/.well-known/agent-skills/index.json`,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
