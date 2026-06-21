type DaisoFetchMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type DaisoFetchOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  method: DaisoFetchMethod;
  params?: Record<string, unknown>;
  body?: BodyType<unknown>;
  headers?: HeadersInit;
};

export type BodyType<BodyData> = BodyData;

export class DaisoApiError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = "DaisoApiError";
    this.status = status;
    this.detail = detail;
  }
}

function getDaisoApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://fapi.daisomall.co.kr";
}

function appendSearchParams(url: URL, params?: Record<string, unknown>) {
  if (!params) {
    return;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }
}

export async function daisoFetch<T>(
  url: string,
  { method, params, body, headers, ...requestInit }: DaisoFetchOptions,
): Promise<T> {
  const targetUrl = new URL(url, getDaisoApiBaseUrl());
  appendSearchParams(targetUrl, params);

  const response = await fetch(targetUrl, {
    ...requestInit,
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new DaisoApiError(
      "Daiso API 요청 중 오류가 발생했습니다.",
      response.status,
      responseText,
    );
  }

  if (!responseText) {
    return undefined as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new DaisoApiError(
      "Daiso API 응답을 JSON으로 해석할 수 없습니다.",
      response.status,
      responseText,
    );
  }
}
