import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS } from "@/lib/mcpTools";
import { SITE_NAME_EN, SITE_TAGLINE_EN, SOURCE_REPOSITORY } from "@/lib/site";

/**
 * MCP 서버 매니페스트. modelcontextprotocol 레지스트리의 server.json 스키마를
 * 따르며, 원격 서버이므로 `remotes` 로 Streamable HTTP 엔드포인트를 알린다.
 */
export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  return NextResponse.json(
    {
      $schema:
        "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
      name: "kr.daiso-finder/daiso-finder",
      title: SITE_NAME_EN,
      description: SITE_TAGLINE_EN,
      version: "1.0.0",
      websiteUrl: base,
      repository: { url: SOURCE_REPOSITORY, source: "github" },
      remotes: [
        {
          type: "streamable-http",
          url: `${base}/api/mcp`,
        },
      ],
      capabilities: { tools: { listChanged: false } },
      tools: MCP_TOOLS.map((tool) => ({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
      authentication: { type: "none", required: false },
      documentation: {
        developerPortal: `${base}/developers`,
        openapi: `${base}/openapi.json`,
        agentInstructions: `${base}/agent-instructions.md`,
        llmsTxt: `${base}/llms.txt`,
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
