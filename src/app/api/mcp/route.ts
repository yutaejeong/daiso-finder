import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS as TOOLS } from "@/lib/mcpTools";

export const dynamic = "force-dynamic";

const SERVER_NAME = "daiso-finder";
const SERVER_VERSION = "1.0.0";
/** 지원하는 MCP 프로토콜 리비전. 최신값을 기본으로 협상한다. */
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID, Authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
};

type JsonRpcRequest = {
  jsonrpc?: string;
  method?: string;
  params?: Record<string, unknown>;
  id?: string | number | null;
};

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
      code: data?.code,
      hint: data?.hint,
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

  if (name === "get_product_availability") {
    const branchCode = String(args.branchCode ?? args.branchCd ?? "");
    const productId = String(args.productId ?? args.id ?? "");
    const url = new URL(`/api/products/${productId}`, origin);
    url.searchParams.set("branchCode", branchCode);
    return content(await fetchJson(url));
  }

  throw new Error(`Unknown tool: ${name}`);
}

function negotiateProtocolVersion(requested: unknown) {
  return typeof requested === "string" &&
    SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
    ? requested
    : LATEST_PROTOCOL_VERSION;
}

function serverInfo(origin: string) {
  return {
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      title: "Daiso Finder",
      description: "Daiso store and product stock MCP server",
    },
    endpoint: `${origin}/api/mcp`,
    transport: "streamable-http",
    protocol: "JSON-RPC 2.0 over Streamable HTTP",
    protocolVersion: LATEST_PROTOCOL_VERSION,
    protocolVersions: SUPPORTED_PROTOCOL_VERSIONS,
    manifest: `${origin}/.well-known/mcp.json`,
    capabilities: { tools: { listChanged: false } },
    tools: TOOLS,
  };
}

/** 단일 JSON-RPC 요청 처리. 알림(id 없음)이면 null 을 돌려준다. */
async function handleRpc(
  message: JsonRpcRequest,
  origin: string,
): Promise<Record<string, unknown> | null> {
  const { method, params = {}, id } = message;
  const isNotification = id === undefined || id === null;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      result: {
        protocolVersion: negotiateProtocolVersion(params.protocolVersion),
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
          title: "Daiso Finder",
        },
        instructions:
          "Call search_stores or search_nearby_stores first to get a store code, then search_products for in-store stock and shelf placement.",
      },
      id: id ?? null,
    };
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", result: {}, id: id ?? null };
  }

  if (method?.startsWith("notifications/") || isNotification) {
    return null;
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", result: { tools: TOOLS }, id };
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params as {
      name: string;
      arguments?: Record<string, unknown>;
    };
    try {
      return {
        jsonrpc: "2.0",
        result: { content: await callTool(name, args, origin) },
        id,
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        result: {
          content: [
            {
              type: "text",
              text: err instanceof Error ? err.message : "Internal error",
            },
          ],
          isError: true,
        },
        id,
      };
    }
  }

  return {
    jsonrpc: "2.0",
    error: { code: -32601, message: `Method not found: ${method}` },
    id,
  };
}

function acceptsEventStream(request: NextRequest) {
  return (request.headers.get("accept") ?? "").includes("text/event-stream");
}

/**
 * Streamable HTTP 클라이언트는 보통 두 타입을 함께 보낸다. 서버는 둘 중
 * 하나를 고를 수 있으므로, 응답이 한 건뿐인 여기서는 JSON 을 선호하고
 * SSE 만 받겠다고 한 클라이언트에게만 이벤트 스트림으로 답한다.
 */
function prefersEventStream(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return (
    accept.includes("text/event-stream") &&
    !accept.includes("application/json") &&
    !accept.includes("*/*")
  );
}

function sseResponse(payload: unknown, extraHeaders: Record<string, string>) {
  const body = `event: message\ndata: ${JSON.stringify(payload)}\n\n`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** 세션 종료. 상태를 보관하지 않으므로 항상 성공으로 응답한다. */
export function DELETE() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  if (!acceptsEventStream(request)) {
    return NextResponse.json(serverInfo(origin), {
      headers: {
        ...CORS_HEADERS,
        "MCP-Protocol-Version": LATEST_PROTOCOL_VERSION,
      },
    });
  }

  // Streamable HTTP 의 서버→클라이언트 스트림. 서버가 먼저 보낼 메시지가
  // 없으므로 keep-alive 주석만 흘리고 클라이언트가 끊으면 정리한다.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": mcp stream open\n\n"));

      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      const close = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // 이미 닫힌 스트림
        }
      };

      request.signal.addEventListener("abort", close);
      // 서버리스 실행 시간을 묶어두지 않도록 상한을 둔다.
      setTimeout(close, 60000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...CORS_HEADERS,
      "MCP-Protocol-Version": LATEST_PROTOCOL_VERSION,
    },
  });
}

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const batch = Array.isArray(body);
  const messages: JsonRpcRequest[] = batch
    ? (body as JsonRpcRequest[])
    : [body as JsonRpcRequest];
  const responses = (
    await Promise.all(messages.map((message) => handleRpc(message, origin)))
  ).filter(
    (response): response is Record<string, unknown> => response !== null,
  );

  const extraHeaders: Record<string, string> = {
    "MCP-Protocol-Version": LATEST_PROTOCOL_VERSION,
  };

  if (messages.some((message) => message?.method === "initialize")) {
    extraHeaders["Mcp-Session-Id"] = crypto.randomUUID();
  }

  // 알림만 담긴 요청에는 본문 없이 202 로 응답하는 것이 스펙 동작이다.
  if (responses.length === 0) {
    return new NextResponse(null, {
      status: 202,
      headers: { ...CORS_HEADERS, ...extraHeaders },
    });
  }

  const payload = batch ? responses : responses[0];

  if (prefersEventStream(request)) {
    return sseResponse(payload, extraHeaders);
  }

  return NextResponse.json(payload, {
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}
