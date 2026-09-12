# 오류 추적 (Sentry)

GA4 가 "얼마나 터졌는지" 를 센다면 Sentry 는 "무엇이 왜 터졌는지" 를 본다.
브라우저·Node(API 라우트)·엣지(미들웨어) 세 런타임에서 같은 설정으로 돈다.

| 파일                       | 역할                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `src/lib/sentry.ts`        | 세 런타임이 공유하는 옵션과 마스킹 규칙 (SDK 를 import 하지 않는 순수 모듈) |
| `sentry.client.config.ts`  | 브라우저 초기화. Sentry 웹팩 플러그인이 클라이언트 번들에 끼워 넣는다       |
| `sentry.server.config.ts`  | Node 런타임 초기화                                                          |
| `sentry.edge.config.ts`    | 엣지 런타임(미들웨어) 초기화                                                |
| `src/instrumentation.ts`   | Next 가 서버를 띄울 때 위 두 설정을 런타임에 맞춰 불러온다                  |
| `src/app/global-error.tsx` | 루트 레이아웃까지 깨졌을 때의 마지막 오류 화면                              |
| `next.config.js`           | `withSentryConfig` — 자동 계측과 소스맵 업로드 설정                         |

세 설정 파일의 이름과 위치는 Sentry 웹팩 플러그인이 약속한 것이라 바꾸면 안 된다.
`src/instrumentation.ts` 는 `next.config.js` 의 `experimental.instrumentationHook`
이 켜져 있어야 동작한다(Next 15 부터는 기본값).

## 켜는 법

`NEXT_PUBLIC_SENTRY_DSN` 이 없으면 SDK 는 초기화되지만 아무것도 전송하지 않는다.
로컬 개발과 CI 의 기본 상태이며, 이 상태로도 빌드는 경고 없이 성공한다.

| 환경변수                                              | 설명                                                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`                              | Sentry 프로젝트 DSN. 비우면 수집이 꺼진다                                          |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT`                      | 대시보드에서 환경을 가르는 이름. 기본값은 `NEXT_PUBLIC_VERCEL_ENV` 또는 `NODE_ENV` |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`               | 성능 트레이스 표본 비율 0~1. 기본값 0.1, 범위를 벗어나면 기본값                    |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | 소스맵 업로드용. 빌드 서버에만 둔다                                                |
| `SENTRY_URL`                                          | Sentry 인스턴스 주소. 기본값 `https://de.sentry.io` (아래 EU 리전 항목 참고)       |

DSN 은 공개 값이라 클라이언트에 노출돼도 문제없다. 반면 `SENTRY_AUTH_TOKEN` 은
시크릿이므로 `.env.local` 이나 배포 플랫폼의 환경변수로만 넣는다.

### EU 리전

이 서비스의 Sentry 조직(`taejeong`)은 **EU 리전**이라 수집 주소가
`o…ingest.de.sentry.io` 다. DSN 에 리전이 이미 박혀 있어 이벤트 전송은 신경 쓸 게
없지만, **소스맵 업로드는 기본값이 `sentry.io` 라 그대로 두면 조용히 실패한다.**
그래서 `next.config.js` 가 `sentryUrl` 을 `https://de.sentry.io` 로 기본 설정한다.
조직을 미국 리전으로 옮기면 `SENTRY_URL=https://sentry.io` 로 덮어쓴다.

### 소스맵

`SENTRY_AUTH_TOKEN` 이 있을 때만 소스맵을 만들어 업로드하고, 업로드가 끝나면
빌드 결과물에서 지운다(`deleteSourcemapsAfterUpload`). 토큰이 없으면 소스맵
단계를 통째로 건너뛰므로 토큰 없이 빌드해도 실패하지 않는다. 대신 스택 트레이스가
압축된 코드 그대로 보인다.

Sentry 토큰을 CI 에 넣을 때는 `@sentry/cli` 의 설치 스크립트가 돌아야 한다.
pnpm 10 은 설치 스크립트를 기본으로 막으므로 `pnpm-workspace.yaml` 의
`allowBuilds` 에 `@sentry/cli` 를 올려 두었다.

## 무엇을 올리고 무엇을 안 올리나

| 자리                                       | 올라가는 것                                                |
| ------------------------------------------ | ---------------------------------------------------------- |
| `src/app/error.tsx`                        | 화면이 깨졌을 때. `boundary: error` 태그                   |
| `src/app/global-error.tsx`                 | 루트 레이아웃까지 깨졌을 때. `boundary: global-error` 태그 |
| `src/lib/apiError.ts` 의 `internalError()` | API 500. `api_error_code: internal_error` 태그             |
| 자동 계측                                  | 서버 컴포넌트·라우트 핸들러에서 밖으로 튀어나온 예외       |

API 라우트는 오류를 전부 잡아서 JSON 으로 바꾸기 때문에 자동 계측에 걸리는 것이
없다. 그래서 `internalError()` 안에서 직접 올린다. 반대로 상류 다이소 API 가 준
오류(`upstreamError()`)는 우리가 고칠 수 있는 버그가 아니고 양도 많아 올리지 않는다.

React Query 의 쿼리 실패도 올리지 않는다. 대부분 상류 오류라 화면의 오류 모달로
충분하다. 필요해지면 `src/app/provider.tsx` 의 `QueryCache.onError` 에서 올리면
되지만, 무료 할당량을 금방 먹는다는 점을 감안한다.

## 개인정보

개인정보 처리방침이 약속한 범위를 오류 리포트가 넘지 않도록 `src/lib/sentry.ts`
에서 두 가지를 막는다.

- `sendDefaultPii: false` — IP·쿠키 같은 값을 붙이지 않는다.
- URL 에 담긴 `q`, `keyword`, `lat`, `lng` 값을 `[redacted]` 로 바꾼다. 대상 키는
  `SENSITIVE_QUERY_KEYS` 한 곳에 있고, `tests/sentry.test.mjs` 가 앱이 실제로 쓰는
  검색 파라미터를 다 덮는지 확인한다.
- 마스킹 훅은 네 개다. `beforeSend`(오류), `beforeSendTransaction`(성능 트랜잭션),
  `beforeSendSpan`(스팬), `beforeBreadcrumb`(네비게이션·fetch 기록). **`beforeSend`
  는 오류 이벤트에만 걸린다.** 트랜잭션 훅을 빼면 성능 트레이스에 실린 요청 URL
  로 검색어가 그대로 나가므로, 훅을 하나라도 지우면 안 된다.

검색 파라미터 이름을 바꾸면(`src/lib/searchParams.ts`) `SENSITIVE_QUERY_KEYS` 도
같이 고쳐야 한다. 테스트가 잡아준다.

세션 리플레이는 켜지 않았다. 화면에 검색어가 그대로 찍히는 데다 번들이 커진다.
켜려면 `sentry.client.config.ts` 의 `integrations` 에 `Sentry.replayIntegration()`
을 추가하고, 마스킹 옵션과 개인정보 처리방침을 함께 손봐야 한다.

## 번들 비용

SDK 는 DSN 이 없어도 번들에 들어간다. `pnpm build` 기준으로 도입 전후는 이렇다.

|                   | 공통 First Load JS | 미들웨어 |
| ----------------- | ------------------ | -------- |
| 도입 전           | 87.3 kB            | 26.7 kB  |
| 현재              | 141 kB             | 94.6 kB  |
| 트레이싱까지 빼면 | 120 kB             | 85.9 kB  |

성능 트레이싱이 필요 없어지면 `next.config.js` 의
`webpack.treeshake.removeTracing: true` 로 21 kB 정도를 더 줄일 수 있다.

## 확인하는 법

DSN 이 살아 있는지만 보려면 봉투(envelope)를 하나 직접 쏴 보는 게 제일 빠르다.
200 과 함께 이벤트 id 가 돌아오면 그 DSN 은 정상이다.

```bash
curl -i -X POST \
  "https://o<조직id>.ingest.de.sentry.io/api/<프로젝트id>/envelope/?sentry_key=<키>&sentry_version=7" \
  -H "Content-Type: application/x-sentry-envelope" \
  --data-binary $'{"event_id":"<32자리 hex>"}\n{"type":"event"}\n{"message":"test"}'
```

앱까지 묶어서 보려면 DSN 을 넣고 빌드한 뒤 임시로 예외를 던지는 라우트를 하나 두고
찔러 본다. 개발 모드에서도 DSN 만 있으면 전송된다.

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@o0.ingest.sentry.io/0 pnpm dev
```

테스트에서는 진짜 SDK 대신 `tests/sentryStub.mjs` 가 로드된다. Node 의 ESM 인터롭이
Sentry 의 CJS 번들에서 이름을 찾아내지 못하는 데다, 테스트가 외부로 리포트를 보낼
이유도 없기 때문이다. 바꿔치기는 `tests/alias-hook.mjs` 의 `STUBS` 가 한다.
