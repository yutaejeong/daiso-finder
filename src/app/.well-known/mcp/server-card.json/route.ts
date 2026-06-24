import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  return NextResponse.json({
    serverInfo: {
      name: "daiso-finder",
      version: "1.0.0",
      description: "다이소 매장 및 상품 재고 검색 MCP 서버",
    },
    endpoint: `${base}/api/mcp`,
    protocol: "JSON-RPC 2.0 over POST",
    capabilities: { tools: {} },
    tools: [
      "search_stores",
      "search_nearby_stores",
      "get_store",
      "search_products",
    ],
    docs: {
      llms: `${base}/llms.txt`,
      apiCatalog: `${base}/.well-known/api-catalog`,
      skills: `${base}/.well-known/agent-skills/index.json`,
    },
  });
}
