"use client";

import { useEffect } from "react";

type McpTool = {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: unknown, signal?: AbortSignal) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (tool: McpTool) => { deregister: () => void };
};

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export function WebMCP() {
  useEffect(() => {
    const ctx = navigator.modelContext;
    if (!ctx) return;

    const storesTool = ctx.registerTool({
      name: "search_stores",
      description:
        "다이소 매장을 주소 또는 지점명으로 검색합니다. 반환된 code 값을 search_products에 사용하세요.",
      inputSchema: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "검색할 주소 또는 지점명" },
          currentPage: {
            type: "number",
            description: "페이지 번호 (기본값: 1)",
            default: 1,
          },
        },
        required: ["keyword"],
      },
      async execute(args) {
        const { keyword, currentPage = 1 } = args as {
          keyword: string;
          currentPage?: number;
        };
        const url = new URL("/api/branches/search", window.location.origin);
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("currentPage", String(currentPage));
        url.searchParams.set("pageSize", "10");
        url.searchParams.set("pageIndex", "0");
        const res = await fetch(url);
        return res.json();
      },
    });

    const productsTool = ctx.registerTool({
      name: "search_products",
      description:
        "특정 다이소 매장에서 상품 재고와 진열 위치를 검색합니다. search_stores로 매장 코드를 먼저 확인하세요.",
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
      async execute(args) {
        const { branchCd, keyword } = args as {
          branchCd: string;
          keyword: string;
        };
        const url = new URL("/api/products", window.location.origin);
        url.searchParams.set("branchCd", branchCd);
        url.searchParams.set("keyword", keyword);
        const res = await fetch(url);
        return res.json();
      },
    });

    return () => {
      storesTool.deregister();
      productsTool.deregister();
    };
  }, []);

  return null;
}
