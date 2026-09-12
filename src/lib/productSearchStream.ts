import {
  ProductApiResponse,
  ProductSearchProgress,
  ProductStreamEvent,
} from "@/app/api/products/types";
import { SEARCH_SOURCE_HEADER } from "@/lib/searchLog";

const DEFAULT_ERROR_MESSAGE = "상품 검색 중 오류가 발생했습니다.";

interface FetchOptions {
  onProgress?: (progress: ProductSearchProgress) => void;
  signal?: AbortSignal;
}

function isStreamEvent(value: unknown): value is ProductStreamEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

/**
 * `/api/products` 를 NDJSON 스트림으로 호출한다.
 * 상품이 하나씩 확정될 때마다 `onProgress` 가 호출되고,
 * 마지막 `result` 이벤트가 최종 응답으로 반환된다.
 */
export async function fetchProductsWithProgress(
  params: URLSearchParams,
  { onProgress, signal }: FetchOptions = {},
): Promise<ProductApiResponse> {
  const query = new URLSearchParams(params);
  query.set("stream", "1");

  const response = await fetch(`/api/products?${query.toString()}`, {
    headers: {
      Accept: "application/x-ndjson",
      // 검색어 수집에서 웹 UI 검색과 API 직접 호출을 구분하기 위한 표식.
      [SEARCH_SOURCE_HEADER]: "web",
    },
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || DEFAULT_ERROR_MESSAGE, {
      cause: body?.detail,
    });
  }

  // 스트림을 지원하지 않는 환경(프록시 등)에서는 일반 JSON 응답으로 처리한다.
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.body || !contentType.includes("application/x-ndjson")) {
    return response.json();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ProductApiResponse | null = null;

  const handleLine = (line: string): ProductApiResponse | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    let event: unknown;
    try {
      event = JSON.parse(trimmed);
    } catch {
      return null;
    }
    if (!isStreamEvent(event)) return null;

    if (event.type === "progress") {
      const { type: _type, ...progress } = event;
      onProgress?.(progress);
      return null;
    }

    if (event.type === "error") {
      throw new Error(event.error || DEFAULT_ERROR_MESSAGE, {
        cause: event.detail,
      });
    }

    const { type: _type, ...payload } = event;
    return payload;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        result = handleLine(line) ?? result;
        newlineIndex = buffer.indexOf("\n");
      }
    }

    buffer += decoder.decode();
    result = handleLine(buffer) ?? result;
  } finally {
    reader.cancel().catch(() => {});
  }

  if (!result) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  return result;
}
