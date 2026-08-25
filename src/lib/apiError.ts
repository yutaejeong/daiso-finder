import { getBaseUrl } from "@/lib/site";

/**
 * 에이전트가 파싱할 수 있는 오류 코드. 문자열 값은 공개 계약이므로
 * OpenAPI 스펙(`src/lib/openapi.ts`)의 enum 과 항상 같이 수정한다.
 */
export const API_ERROR_CODES = [
  "missing_parameter",
  "invalid_parameter",
  "not_found",
  "route_not_found",
  "method_not_allowed",
  "upstream_error",
  "internal_error",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiErrorBody = {
  /** 한국어 사용자 노출 메시지. 기존 클라이언트가 읽는 필드라 유지한다. */
  error: string;
  /** 기계 판독용 안정 식별자 */
  code: ApiErrorCode;
  /** 에이전트를 위한 영어 설명 */
  message: string;
  /** 다음에 무엇을 하면 되는지에 대한 해결 힌트 */
  hint: string;
  status: number;
  documentation: string;
  detail?: string;
};

type ApiErrorInit = {
  status: number;
  code: ApiErrorCode;
  error: string;
  message: string;
  hint: string;
  detail?: string;
  headers?: Record<string, string>;
};

export function buildApiErrorBody({
  status,
  code,
  error,
  message,
  hint,
  detail,
}: Omit<ApiErrorInit, "headers">): ApiErrorBody {
  return {
    error,
    code,
    message,
    hint,
    status,
    documentation: `${getBaseUrl()}/developers`,
    ...(detail === undefined ? {} : { detail }),
  };
}

/** 모든 `/api` 오류 응답은 이 헬퍼를 통해 동일한 JSON 형태로 나간다. */
export function apiErrorResponse(init: ApiErrorInit): Response {
  const { headers, ...rest } = init;

  return new Response(JSON.stringify(buildApiErrorBody(rest)), {
    status: init.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function missingParameter(
  error: string,
  message: string,
  hint: string,
): Response {
  return apiErrorResponse({
    status: 400,
    code: "missing_parameter",
    error,
    message,
    hint,
  });
}

export function notFound(
  error: string,
  message: string,
  hint: string,
): Response {
  return apiErrorResponse({
    status: 404,
    code: "not_found",
    error,
    message,
    hint,
  });
}

/**
 * 다이소 외부 API 오류. 4xx 는 그대로 전달하고 5xx 는 게이트웨이 오류로 정규화한다.
 */
export function upstreamError(
  error: string,
  status: number,
  detail: string,
  hint: string,
): Response {
  const normalizedStatus = status >= 400 && status < 500 ? status : 502;

  return apiErrorResponse({
    status: normalizedStatus,
    code: "upstream_error",
    error,
    message: `The upstream Daiso API responded with HTTP ${status}.`,
    hint,
    detail,
  });
}

export function internalError(error: unknown, contextHint: string): Response {
  return apiErrorResponse({
    status: 500,
    code: "internal_error",
    error: "서버 오류가 발생했습니다.",
    message: "Daiso Finder failed to complete the request.",
    hint: contextHint,
    detail: error instanceof Error ? error.message : String(error),
  });
}
