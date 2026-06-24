"use client";

import { useEffect } from "react";

type McpTool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (args: unknown, signal?: AbortSignal) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (
    tool: McpTool,
    options?: { signal?: AbortSignal },
  ) => { deregister?: () => void } | void;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }

  interface Navigator {
    modelContext?: ModelContext;
  }
}

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPageSize(value: unknown) {
  return Math.min(Math.max(asNumber(value, 10), 1), 10);
}

function textContent(text: string) {
  return { content: [{ type: "text", text }] };
}

function toolResult(data: unknown) {
  const json = JSON.stringify(data);
  const text = json.length <= 1500 ? json : `${json.slice(0, 1470)}...`;
  return textContent(text);
}

async function fetchJson(url: URL, signal?: AbortSignal) {
  const res = await fetch(url, { signal });
  const data = await res.json();

  if (!res.ok) {
    return {
      error: data?.error ?? `HTTP ${res.status}`,
      detail: data?.detail,
    };
  }

  return data;
}

export function WebMCP() {
  useEffect(() => {
    const ctx = document.modelContext ?? navigator.modelContext;
    if (!ctx) return;
    const controller = new AbortController();
    const legacyDeregisterCallbacks: Array<() => void> = [];

    const registerTool = (tool: McpTool) => {
      const result = ctx.registerTool(tool, { signal: controller.signal });
      if (result?.deregister) {
        legacyDeregisterCallbacks.push(result.deregister);
      }
    };

    registerTool({
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
      async execute(args, signal) {
        const { keyword, currentPage = 1, pageSize = 10 } = args as {
          keyword: string;
          currentPage?: number;
          pageSize?: number;
        };
        const url = new URL("/api/branches/search", window.location.origin);
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("currentPage", String(currentPage));
        url.searchParams.set("pageSize", String(clampPageSize(pageSize)));
        url.searchParams.set("pageIndex", "0");
        return toolResult(await fetchJson(url, signal));
      },
    });

    registerTool({
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
      async execute(args, signal) {
        const {
          latitude,
          longitude,
          currentPage = 1,
          pageSize = 10,
        } = args as {
          latitude: number;
          longitude: number;
          currentPage?: number;
          pageSize?: number;
        };
        const url = new URL("/api/branches/search", window.location.origin);
        url.searchParams.set("curLttd", String(latitude));
        url.searchParams.set("curLitd", String(longitude));
        url.searchParams.set("currentPage", String(currentPage));
        url.searchParams.set("pageSize", String(clampPageSize(pageSize)));
        url.searchParams.set("pageIndex", "0");
        return toolResult(await fetchJson(url, signal));
      },
    });

    registerTool({
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
      async execute(args, signal) {
        const { branchCode } = args as { branchCode: string };
        const url = new URL(`/api/branches/${branchCode}`, window.location.origin);
        return toolResult(await fetchJson(url, signal));
      },
    });

    registerTool({
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
      async execute(args, signal) {
        const { branchCode, keyword, currentPage = 1 } = args as {
          branchCode: string;
          keyword: string;
          currentPage?: number;
        };
        const url = new URL("/api/products", window.location.origin);
        url.searchParams.set("branchCode", branchCode);
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("currentPage", String(currentPage));
        return toolResult(await fetchJson(url, signal));
      },
    });

    registerTool({
      name: "open_store_page",
      description:
        "Navigate this tab to a Daiso store page for a branchCode so the user can see and search it.",
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
      annotations: { readOnlyHint: false },
      async execute(args) {
        const { branchCode } = args as { branchCode: string };
        window.location.assign(`/branch/${encodeURIComponent(branchCode)}`);
        return textContent(`Opening store page for ${branchCode}`);
      },
    });

    return () => {
      controller.abort();
      legacyDeregisterCallbacks.forEach((deregister) => deregister());
    };
  }, []);

  return null;
}
