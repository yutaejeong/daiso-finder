/**
 * Sentry 공통 설정. 브라우저·서버·엣지 세 런타임이 같은 옵션과 같은 마스킹
 * 규칙을 쓰도록 한곳에서 만든다. 설정 방법은 `docs/sentry.md` 참고.
 *
 * 이 모듈은 SDK 를 import 하지 않는다. 값만 만드는 순수 모듈로 두어야
 * 테스트에서 그대로 검증할 수 있고, `Sentry.init()` 은 런타임별 설정 파일
 * (`sentry.client.config.ts` 등)에서만 부른다.
 *
 * DSN 이 없으면 SDK 를 아예 켜지 않는다. 로컬 개발과 CI 의 기본값이다.
 */

import type { Breadcrumb, ErrorEvent, EventHint, init } from "@sentry/nextjs";
import { UPSTREAM_ERROR_NAMES } from "@/lib/upstreamErrors";

// 트랜잭션·스팬 타입은 `@sentry/nextjs` 가 직접 내보내지 않는다. 내부 패키지를
// 가져다 쓰는 대신 `Sentry.init()` 이 받는 훅의 시그니처에서 뽑아 쓴다.
type SentryOptions = NonNullable<Parameters<typeof init>[0]>;
type TransactionEvent = Parameters<
  NonNullable<SentryOptions["beforeSendTransaction"]>
>[0];
type SpanJSON = Parameters<NonNullable<SentryOptions["beforeSendSpan"]>>[0];

/** 오류 리포트에 담기면 안 되는 쿼리 파라미터. 검색어와 좌표다. */
export const SENSITIVE_QUERY_KEYS = ["q", "keyword", "lat", "lng"] as const;

export const REDACTED = "[redacted]";

/**
 * Next 이미지 최적화 라우트. 여기 붙는 `q` 는 검색어가 아니라 이미지 품질값이라
 * 가릴 이유가 없다(가리면 `/_next/image?...&q=[redacted]` 처럼 남아 디버깅만 어렵다).
 */
const IMAGE_OPTIMIZER_PATH = "/_next/image";

function sensitiveKeysFor(path: string): readonly string[] {
  return path.endsWith(IMAGE_OPTIMIZER_PATH)
    ? SENSITIVE_QUERY_KEYS.filter((key) => key !== "q")
    : SENSITIVE_QUERY_KEYS;
}

/** 트레이스 표본 비율 기본값. 무료 할당량을 넘기지 않을 만큼만 본다. */
const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

/**
 * 브라우저 확장·네트워크 사정으로 생기는, 우리가 고칠 수 없는 잡음.
 * 실제 버그를 가릴 수 있으므로 정말 손댈 수 없는 것만 넣는다.
 */
const IGNORED_ERRORS = [
  // 레이아웃 계산 중 브라우저가 스스로 내는 경고. 화면에 영향이 없다.
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications.",
  // 화면을 벗어나며 진행 중이던 요청이 끊긴 경우.
  "AbortError",
  "The user aborted a request.",
];

/**
 * 브라우저에서 우리 번들로 인정하는 스크립트 주소. Sentry 의 `allowUrls` 로 넘겨
 * 스택 맨 위 프레임이 여기에 없는 오류는 보내지 않는다. 스택이 없는 오류
 * (`Failed to fetch` 같은 것)는 이 필터와 상관없이 올라온다.
 *
 * 우리 코드는 전부 `/_next/` 아래 청크로 나간다(Sentry 가 `app:///_next/...` 로
 * 바꿔 적어도 걸린다). 반면 Chrome iOS 는 번역·자동 채우기 스크립트를 페이지에
 * 끼워 넣는데, 그 스크립트의 파일명이 문서 주소(`/branch/10837` 같은)로 잡힌다.
 * 실제로 한 사용자에게서 6분 새 `RangeError: Maximum call stack size exceeded`
 * 이슈 여섯 개가 서른 건 넘게 쌓였고, 프레임이 가리킨 "문서 226번째 줄" 은
 * 한 줄짜리인 우리 HTML 에 있을 수 없는 자리였다.
 */
export const CLIENT_ALLOW_URLS: RegExp[] = [/\/_next\//];

/**
 * 상류 다이소 API 가 실패해서 난 오류인지. API 라우트는 이미 `upstreamError()`
 * 로 돌려주고 올리지 않지만, 서버 컴포넌트(`/branch/[code]` 등)에서 밖으로
 * 튀어나온 것은 자동 계측이 잡아 올린다. 크롤러가 상류 장애 중에 매장 페이지를
 * 훑으면 그대로 수십 건이 쌓인다. 우리가 고칠 버그가 아니므로 같은 기준으로 뺀다.
 * 페이지 자체는 그대로 5xx 로 나가서 크롤러는 나중에 다시 온다.
 */
export function isUpstreamErrorEvent(event: ErrorEvent, hint?: EventHint) {
  const names: readonly string[] = UPSTREAM_ERROR_NAMES;
  const original = hint?.originalException;

  if (original instanceof Error && names.includes(original.name)) {
    return true;
  }

  return (event.exception?.values ?? []).some(
    (value) => value.type !== undefined && names.includes(value.type),
  );
}

export function getSentryDsn(): string {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ?? "";
}

/** DSN 이 설정돼 있어야만 리포트를 보낸다. */
export function isSentryEnabled(): boolean {
  return getSentryDsn() !== "";
}

/** Sentry 대시보드에서 배포 환경을 가르는 이름. */
export function getSentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}

/**
 * 트레이스 표본 비율. 환경변수가 없거나 0~1 밖의 값이면 기본값으로 돌아간다.
 */
export function getTracesSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE?.trim();
  if (!raw) {
    return DEFAULT_TRACES_SAMPLE_RATE;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_TRACES_SAMPLE_RATE;
  }

  return parsed;
}

/**
 * URL 에서 검색어와 좌표를 지운다. 개인정보 처리방침이 약속한 대로 검색어와
 * 좌표는 오류 리포트에도 남기지 않는다. 쿼리가 없으면 원본을 그대로 돌려준다.
 */
export function scrubUrl(value: string): string {
  const queryStart = value.indexOf("?");
  if (queryStart === -1) {
    return value;
  }

  const path = value.slice(0, queryStart);
  const rest = value.slice(queryStart + 1);
  const hashStart = rest.indexOf("#");
  const hash = hashStart === -1 ? "" : rest.slice(hashStart);
  const query = hashStart === -1 ? rest : rest.slice(0, hashStart);

  const params = new URLSearchParams(query);
  let changed = false;
  for (const key of sensitiveKeysFor(path)) {
    if (params.has(key)) {
      params.set(key, REDACTED);
      changed = true;
    }
  }

  if (!changed) {
    return value;
  }

  return `${path}?${params.toString()}${hash}`;
}

/**
 * 값 전체가 쿼리 문자열 하나인 경우(`url.query` 등). 앞의 `?` 유무는 그대로 둔다.
 */
function scrubQueryValue(value: string): string {
  const hasPrefix = value.startsWith("?");
  const scrubbed = scrubUrl(hasPrefix ? value : `?${value}`);
  return hasPrefix ? scrubbed : scrubbed.slice(1);
}

/** 쿼리 문자열만 따로 들고 있는 필드(`request.query_string`)용. */
export function scrubQueryString(
  value: string | Record<string, string> | Array<[string, string]>,
): string | Record<string, string> | Array<[string, string]> {
  if (typeof value === "string") {
    return scrubQueryValue(value);
  }

  const sensitive = new Set<string>(SENSITIVE_QUERY_KEYS);

  if (Array.isArray(value)) {
    return value.map(([key, entry]): [string, string] =>
      sensitive.has(key) ? [key, REDACTED] : [key, entry],
    );
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) =>
      sensitive.has(key) ? [key, REDACTED] : [key, entry],
    ),
  );
}

/** 브레드크럼(네비게이션·fetch 기록)에 남는 URL 도 같이 가린다. */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const data = breadcrumb.data;
  if (!data) {
    return breadcrumb;
  }

  const scrubbed = { ...data };
  for (const key of ["url", "from", "to"]) {
    if (typeof scrubbed[key] === "string") {
      scrubbed[key] = scrubUrl(scrubbed[key]);
    }
  }

  return { ...breadcrumb, data: scrubbed };
}

/**
 * 스팬에 붙는 값(`http.url`, `url.query` 등)에서도 같은 것을 지운다.
 * 쿼리가 없는 문자열에는 `scrubUrl` 이 아무 일도 하지 않으므로 전부 통과시킨다.
 */
export function scrubSpan(span: SpanJSON): SpanJSON {
  let next = span;

  if (typeof next.description === "string") {
    next = { ...next, description: scrubUrl(next.description) };
  }

  if (next.data) {
    const data: SpanJSON["data"] = { ...next.data };
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== "string") {
        continue;
      }
      // `url.query` 처럼 값이 통째로 쿼리 문자열인 필드는 따로 해석한다.
      data[key] = key.endsWith("query")
        ? scrubQueryValue(value)
        : scrubUrl(value);
    }
    next = { ...next, data };
  }

  return next;
}

function scrubRequest<T extends ErrorEvent | TransactionEvent>(event: T): T {
  const request = event.request;
  if (!request) {
    return event;
  }

  const next = { ...request };
  if (typeof next.url === "string") {
    next.url = scrubUrl(next.url);
  }
  if (next.query_string !== undefined && next.query_string !== null) {
    next.query_string = scrubQueryString(next.query_string);
  }

  return { ...event, request: next };
}

/** 전송 직전 오류 이벤트에서 검색어·좌표를 걷어낸다. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  event = scrubRequest(event);

  if (event.breadcrumbs) {
    event = { ...event, breadcrumbs: event.breadcrumbs.map(scrubBreadcrumb) };
  }

  return event;
}

/**
 * 성능 트랜잭션도 똑같이 훑는다. `beforeSend` 는 오류 이벤트에만 걸리므로
 * 이 훅이 없으면 트레이스에 실린 요청 URL 로 검색어가 그대로 나간다.
 */
export function scrubTransaction(event: TransactionEvent): TransactionEvent {
  event = scrubRequest(event);

  if (event.spans) {
    event = { ...event, spans: event.spans.map(scrubSpan) };
  }

  return event;
}

export interface SentryInitOptions {
  dsn: string;
  enabled: boolean;
  environment: string;
  tracesSampleRate: number;
  sendDefaultPii: false;
  ignoreErrors: string[];
  beforeSend: (event: ErrorEvent, hint: EventHint) => ErrorEvent | null;
  beforeSendTransaction: (
    event: TransactionEvent,
    hint: EventHint,
  ) => TransactionEvent | null;
  beforeSendSpan: (span: SpanJSON) => SpanJSON;
  beforeBreadcrumb: (breadcrumb: Breadcrumb) => Breadcrumb | null;
}

/** 세 런타임의 `Sentry.init()` 이 공유하는 옵션. */
export function baseSentryOptions(): SentryInitOptions {
  return {
    dsn: getSentryDsn(),
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    // release 는 일부러 지정하지 않는다. Sentry 번들러 플러그인이 빌드할 때
    // 커밋 SHA 로 릴리스를 정해 소스맵을 그 이름으로 올리고 같은 값을 번들에
    // 주입한다. 여기서 따로 넣으면 두 값이 어긋나 소스맵만 조용히 안 붙는다.
    tracesSampleRate: getTracesSampleRate(),
    // 이 서비스에는 로그인이 없다. IP·쿠키 같은 값을 굳이 보내지 않는다.
    sendDefaultPii: false,
    ignoreErrors: [...IGNORED_ERRORS],
    beforeSend: (event, hint) =>
      isUpstreamErrorEvent(event, hint) ? null : scrubEvent(event),
    beforeSendTransaction: (event) => scrubTransaction(event),
    beforeSendSpan: (span) => scrubSpan(span),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  };
}
