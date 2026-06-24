import { NextRequest, NextResponse } from "next/server";

const TOOLS = [
  {
    name: "search_stores",
    description:
      "Search Daiso stores by address or store name. Use a returned code as branchCode for product tools.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "Address or store name" },
        currentPage: {
          type: "number",
          description: "Page number",
          default: 1,
        },
        pageSize: {
          type: "number",
          description: "Results per page, max 10",
          default: 10,
        },
      },
      required: ["keyword"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  {
    name: "search_nearby_stores",
    description:
      "Search nearby Daiso stores by latitude and longitude. Use a returned code as branchCode.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number", description: "Current latitude" },
        longitude: { type: "number", description: "Current longitude" },
        currentPage: {
          type: "number",
          description: "Page number",
          default: 1,
        },
        pageSize: {
          type: "number",
          description: "Results per page, max 10",
          default: 10,
        },
      },
      required: ["latitude", "longitude"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  {
    name: "get_store",
    description:
      "Get Daiso store details for a branchCode, including address, coordinates, and opening hours.",
    inputSchema: {
      type: "object",
      properties: {
        branchCode: {
          type: "string",
          description: "Store code from search_stores",
        },
      },
      required: ["branchCode"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  {
    name: "search_products",
    description:
      "Search product stock, price, floor, and zone inside a Daiso store. Requires branchCode.",
    inputSchema: {
      type: "object",
      properties: {
        branchCode: {
          type: "string",
          description: "Store code from search_stores",
        },
        keyword: { type: "string", description: "Product name to search" },
        currentPage: {
          type: "number",
          description: "Page number",
          default: 1,
        },
      },
      required: ["branchCode", "keyword"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
];

function clampPageSize(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(parsed, 1), 10);
}

async function fetchJson(url: URL) {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    return {
      error: data?.error ?? `HTTP ${res.status}`,
      detail: data?.detail,
    };
  }

  return data;
}

function content(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data) }];
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
  origin: string,
) {
  if (name === "search_stores") {
    const url = new URL("/api/branches/search", origin);
    url.searchParams.set("keyword", String(args.keyword ?? ""));
    url.searchParams.set("currentPage", String(args.currentPage ?? 1));
    url.searchParams.set("pageSize", String(clampPageSize(args.pageSize)));
    url.searchParams.set("pageIndex", "0");
    return content(await fetchJson(url));
  }

  if (name === "search_nearby_stores") {
    const url = new URL("/api/branches/search", origin);
    url.searchParams.set("curLttd", String(args.latitude ?? ""));
    url.searchParams.set("curLitd", String(args.longitude ?? ""));
    url.searchParams.set("currentPage", String(args.currentPage ?? 1));
    url.searchParams.set("pageSize", String(clampPageSize(args.pageSize)));
    url.searchParams.set("pageIndex", "0");
    return content(await fetchJson(url));
  }

  if (name === "get_store") {
    const branchCode = String(args.branchCode ?? args.branchCd ?? "");
    const url = new URL(`/api/branches/${branchCode}`, origin);
    return content(await fetchJson(url));
  }

  if (name === "search_products") {
    const branchCode = String(args.branchCode ?? args.branchCd ?? "");
    const url = new URL("/api/products", origin);
    url.searchParams.set("branchCode", branchCode);
    url.searchParams.set("keyword", String(args.keyword ?? ""));
    url.searchParams.set("currentPage", String(args.currentPage ?? 1));
    return content(await fetchJson(url));
  }

  throw new Error(`Unknown tool: ${name}`);
}

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    serverInfo: {
      name: "daiso-finder",
      version: "1.0.0",
      description: "Daiso store and product stock MCP server",
    },
    endpoint: `${origin}/api/mcp`,
    protocol: "JSON-RPC 2.0 over POST",
    capabilities: { tools: {} },
    tools: TOOLS,
  });
}

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;

  let body: {
    jsonrpc: string;
    method: string;
    params?: Record<string, unknown>;
    id?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      },
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
    return NextResponse.json({
      jsonrpc: "2.0",
      result: { tools: TOOLS },
      id,
    });
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
