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

## 터널 라우트 (`/monitoring`)

브라우저가 `ingest.de.sentry.io` 로 직접 보내는 요청은 광고·추적 차단기에 흔히
막힌다. 막히면 그 사용자에게서 나는 클라이언트 오류는 통째로 보이지 않는다.
그래서 `next.config.js` 의 `tunnelRoute` 로 같은 도메인의 `/monitoring` 을 거쳐
서버가 대신 전달한다. 공개 프록시는 아니고, 설정된 프로젝트로만 전달한다.

- `src/middleware.ts` 의 matcher 에서 이 경로를 뺀다. Markdown 협상과 아무 상관이
  없는데 이벤트마다 미들웨어를 태울 이유가 없다.
- `robots.txt` 는 이 경로를 `Disallow` 한다. 사람이 볼 페이지가 아니다.
- 이벤트 하나당 서버 함수 호출이 한 번 늘어난다. 그게 아깝거나 차단기를 우회하고
  싶지 않으면 `tunnelRoute` 한 줄만 지우면 된다. 나머지는 그대로 동작한다.

## 릴리스와 소스맵 이름

`Sentry.init()` 에 `release` 를 **일부러 넣지 않는다.** 번들러 플러그인이 빌드할 때
커밋 SHA 로 릴리스 이름을 정해 소스맵을 그 이름으로 올리고, 같은 값을 번들에도
주입한다. 런타임에서 다른 값을 넣으면 이벤트의 릴리스와 업로드된 소스맵의 릴리스가
어긋나 스택 트레이스만 조용히 안 풀린다. 직접 정하고 싶으면 빌드 환경에
`SENTRY_RELEASE` 를 주면 양쪽이 함께 그 값을 쓴다.

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

이 구분은 라우트가 상류 오류를 제대로 알아볼 때만 성립한다. 실제로 `/api/products`
계열 두 라우트에 분기가 빠져 있어서 상류 장애가 500 `internal_error` 로 나가고
하루 300건 넘게 Sentry 로 올라왔다. 지금은 네 라우트 모두 `upstreamErrorOrNull()`
한 곳을 거친다. 새 라우트를 만들 때도 그 헬퍼를 쓴다.

서버 컴포넌트는 사정이 다르다. `/branch/[code]` 처럼 렌더 중에 상류를 부르는
페이지는 상류가 실패하면 예외가 밖으로 튀어나오고, 자동 계측이 그것을 올린다.
크롤러(PetalBot·bingbot 등)가 장애 중에 매장 페이지를 훑으면 한 시간에 수십 건이
쌓였다. 그래서 공통 `beforeSend` 가 `UPSTREAM_ERROR_NAMES`(`src/lib/upstreamErrors.ts`)
에 든 오류를 런타임과 상관없이 버린다. 페이지 응답은 그대로 5xx 라 크롤러는
색인을 지우지 않고 나중에 다시 온다.

브라우저 설정에는 `allowUrls: CLIENT_ALLOW_URLS`(`/_next/`)가 더 붙는다. 오류가 난
프레임이 우리 번들이 아니면 버린다. Chrome iOS 가 페이지에 끼워 넣는 스크립트는
파일명이 문서 주소(`app:///branch/10837`)로 잡혀서, 한 사용자에게서 난
`Maximum call stack size exceeded` 가 이슈 여섯 개로 갈라져 쌓였었다. 스택이 없는
오류(`Failed to fetch` 등)는 이 필터에 걸리지 않고 그대로 올라온다.

React Query 의 쿼리 실패도 올리지 않는다. 대부분 상류 오류라 화면의 오류 모달로
충분하다. 필요해지면 `src/app/provider.tsx` 의 `QueryCache.onError` 에서 올리면
되지만, 무료 할당량을 금방 먹는다는 점을 감안한다.

## 다이소 API 장애 알림

상류 오류를 올리지 않는 대가로, 다이소가 API 를 바꿔 기능이 통째로 멈춰도 오류
알림은 오지 않는다. 실제로 2026-09 에 매장 재고·진열 조회가 사전 인증 뒤로 옮겨가며
매장 내 상품 검색이 전부 `upstream_error` 로 실패했는데 Sentry 는 조용했다.

그래서 오류 이벤트 대신 **업타임 모니터**로 본다.

- `GET /api/health/daiso` (`src/lib/daisoHealth.ts`)가 매장 내 상품 검색과 같은
  순서로 다이소를 한 번씩 부른다: 상품 검색 → 사전 인증 + 재고 → 진열 위치.
  모두 `success: true` 와 `data[]` 로 답하면 200, 아니면 어느 단계가 왜 깨졌는지를
  담아 503 을 준다. 재고 수량은 보지 않는다(품절이어도 다이소는 정상이다).
- Sentry 업타임 모니터 "다이소 API (매장 재고·진열)"(id `2322840`)가 5분마다 이
  주소를 부른다. 3번 연속 실패하면(약 15분) 업타임 이슈가 열리고, 한 번 성공하면
  닫힌다. 타임아웃은 30초다(검색 → 인증 → 재고 → 진열을 차례로 부르므로).
- 메일은 모니터에 연결된 알림(Alert)이 보낸다. 프로젝트 기본 알림 "Send a
  notification for high priority issues" 는 Issue Stream 에만 연결되어 있으므로,
  Sentry → Monitors → Alerts 에서 알림을 하나 만들어 이 모니터를 소스로 고르고,
  트리거는 새 이슈·회귀·재발, 동작은 이메일(이슈 담당자, 없으면 활성 멤버)로 둔다.
- 메인 페이지만 보는 모니터(`https://www.daiso-finder.kr`, 1분 간격)는 따로 있다.
  그 모니터는 다이소가 죽어도 200 이라 이 장애를 잡지 못한다.

점검 기준(검색어 `건전지`, 강남역점 `11199`)은 `src/lib/daisoHealth.ts` 에 있다.
매장이 문을 닫거나 검색 결과가 비면 점검이 실패로 나오므로 그때 바꾼다.
이 엔드포인트는 에이전트용 API 가 아니라서 OpenAPI 문서와 `/api` 목록에 넣지 않는다.

## 개인정보

개인정보 처리방침이 약속한 범위를 오류 리포트가 넘지 않도록 `src/lib/sentry.ts`
에서 두 가지를 막는다.

- `sendDefaultPii: false` — IP·쿠키 같은 값을 붙이지 않는다.
- URL 에 담긴 `q`, `keyword`, `lat`, `lng` 값을 `[redacted]` 로 바꾼다. 대상 키는
  `SENSITIVE_QUERY_KEYS` 한 곳에 있고, `tests/sentry.test.mjs` 가 앱이 실제로 쓰는
  검색 파라미터를 다 덮는지 확인한다.
- 예외가 하나 있다. `/_next/image` 의 `q` 는 검색어가 아니라 이미지 품질값이라
  가리지 않는다. 실제로 프로덕션 스팬에 `?w=256&q=[redacted]` 로 남아 있었다.
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
