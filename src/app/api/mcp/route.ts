import { NextRequest, NextResponse } from "next/server";

const TOOLS = [
  {
    name: "search_stores",
    description:
      "주소 또는 지점명으로 다이소 매장을 검색합니다. 반환된 code 값을 search_products에 사용하세요.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "검색할 주소 또는 지점명" },
        currentPage: {
          type: "number",
          description: "페이지 번호 (기본값: 1)",
          default: 1,
        },
        pageSize: {
          type: "number",
          description: "페이지당 결과 수 (기본값: 10, 최대: 10)",
          default: 10,
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "search_products",
    description:
      "특정 다이소 매장의 상품 재고 및 진열 위치를 검색합니다. search_stores로 매장 코드를 먼저 확인하세요.",
    inputSchema: {
      type: "object",
      properties: {
        branchCd: {
          type: "string",
          description: "매장 코드 (search_stores 결과의 code 필드)",
        },
        keyword: { type: "string", description: "검색할 상품명" },
      },
      required: ["branchCd", "keyword"],
    },
  },
];

async function callTool(
  name: string,
  args: Record<string, unknown>,
  origin: string,
) {
  if (name === "search_stores") {
    const url = new URL("/api/branches/search", origin);
    url.searchParams.set("keyword", String(args.keyword ?? ""));
    url.searchParams.set("currentPage", String(args.currentPage ?? 1));
    url.searchParams.set("pageSize", String(args.pageSize ?? 10));
    url.searchParams.set("pageIndex", "0");
    const res = await fetch(url);
    const data = await res.json();
    return [{ type: "text", text: JSON.stringify(data) }];
  }

  if (name === "search_products") {
    const url = new URL("/api/products", origin);
    url.searchParams.set("branchCd", String(args.branchCd ?? ""));
    url.searchParams.set("keyword", String(args.keyword ?? ""));
    const res = await fetch(url);
    const data = await res.json();
    return [{ type: "text", text: JSON.stringify(data) }];
  }

  throw new Error(`Unknown tool: ${name}`);
}

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;

  let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
      { status: 400 },
    );
  }

  const { method, params = {}, id } = body;

  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0",
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "daiso-finder", version: "1.0.0" },
      },
      id,
    });
  }

  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 204 });
  }

  if (method === "tools/list") {
    return NextResponse.json({ jsonrpc: "2.0", result: { tools: TOOLS }, id });
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params as {
      name: string;
      arguments?: Record<string, unknown>;
    };
    try {
      const content = await callTool(name, args, origin);
      return NextResponse.json({ jsonrpc: "2.0", result: { content }, id });
    } catch (err) {
      return NextResponse.json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : "Internal error",
        },
        id,
      });
    }
  }

  return NextResponse.json({
    jsonrpc: "2.0",
    error: { code: -32601, message: "Method not found" },
    id,
  });
}
