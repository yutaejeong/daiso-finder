<div align="center">
  <img src="./public/logo.svg" alt="Daiso Finder" width="420" />

  <p>다이소 매장과 상품 재고·진열 위치를 한 번에 찾아주는 Next.js PWA</p>
</div>

---

## 주요 기능

- 키워드 또는 현재 위치(GPS) 기반 다이소 매장 검색 (무한 스크롤)
- 매장 상세 페이지에서 상품 검색 — 가격, 재고 수량, 층/구역 정보 제공
- PWA 지원으로 홈 화면 설치 및 오프라인 캐시
- 외부 API는 Next.js API Route로 프록시하여 CORS와 노출 데이터 최소화
- 인증 없이 쓰는 공개 REST API + OpenAPI 3.1 스펙, MCP 서버, CLI, 샌드박스

## 기술 스택

- **Next.js 14** (App Router) + TypeScript
- **PandaCSS** (CSS-in-JS) + **Tabler UI**
- **TanStack Query** for 서버 상태 관리
- **next-pwa** for 서비스 워커 / 매니페스트
- 폰트: Pretendard / 테마 컬러: `#e60033`

## 빠른 시작

```bash
# Node 22.17.1 (.nvmrc 참고)
pnpm install
cp .env.local.example .env.local
pnpm dev
```

http://localhost:3000 에서 확인.

### 스크립트

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm dev:secure` | HTTPS 개발 서버 (PWA/Geolocation 디버깅용) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm lint` | ESLint 실행 |
| `pnpm test` | Node 기본 테스트 러너 실행 (`tests/*.test.mjs`) |
| `pnpm prepare` | PandaCSS 코드 생성 (`styled-system/` 갱신) |

## 환경 변수

`.env.local.example` 을 복사해 `.env.local` 로 사용합니다. `NEXT_PUBLIC_*` 값은 클라이언트에 노출되는 공개 값이며, 시크릿은 포함되어 있지 않습니다.

| 키 | 설명 |
| --- | --- |
| `DAISO_API_URL` | 서버사이드 다이소 외부 API 베이스 URL. 설정하면 `NEXT_PUBLIC_API_URL`보다 우선 사용 |
| `NEXT_PUBLIC_API_URL` | 다이소 외부 API 베이스 URL |
| `NEXT_PUBLIC_APP_URL` | 배포 도메인 (sitemap, canonical URL 등에 사용) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 측정 ID |
| `WEBMCP_ORIGIN_TRIAL_TOKEN` | Chrome WebMCP Origin Trial 토큰. 설정하면 `Origin-Trial` 헤더로 내려가 배포 origin에서 `document.modelContext`를 활성화 |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry 오류 수집 DSN. 비우면 수집이 꺼짐 (`docs/sentry.md`) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry 소스맵 업로드용. 없으면 업로드만 건너뜀 |

### 테스트

```bash
pnpm test                     # 단위 테스트
# 빌드된 서버를 켠 뒤 엔드포인트 확인까지 함께 실행
pnpm build && pnpm start &
DAISO_E2E_BASE_URL=http://localhost:3000 pnpm test
```

`DAISO_E2E_BASE_URL` 이 없으면 HTTP 엔드투엔드 테스트는 건너뜁니다.

## 공개 API

인증이 필요 없는 무료 공개 API 입니다. API 키·가입·승인 절차가 없습니다.

| 엔드포인트 | operationId | 설명 |
| --- | --- | --- |
| `GET /api` | `getApiIndex` | 엔드포인트·발견 문서 인덱스 |
| `GET /api/branches/search` | `searchStores` | 키워드/GPS 매장 검색 |
| `GET /api/branches/{code}` | `getStore` | 매장 단건 조회 |
| `GET /api/products` | `searchStoreProducts` | 매장 내 재고 상품 검색 |
| `GET /api/products/{id}` | `getProductAvailability` | 상품 재고·진열 위치·주변 매장 |
| `GET/POST /api/mcp` | `callMcp` | MCP Streamable HTTP 엔드포인트 |
| `GET /api/sandbox/**` | — | 고정 픽스처 응답 (외부 호출 없음) |

- 전체 명세: [`/openapi.json`](https://daiso-finder.kr/openapi.json), [`/openapi.yaml`](https://daiso-finder.kr/openapi.yaml)
- 개발자 포털: [`/developers`](https://daiso-finder.kr/developers)
- 에이전트 안내: [`/agent-instructions.md`](https://daiso-finder.kr/agent-instructions.md), [`/llms.txt`](https://daiso-finder.kr/llms.txt)
- MCP 매니페스트: [`/.well-known/mcp.json`](https://daiso-finder.kr/.well-known/mcp.json)

오류는 항상 JSON 이며 `{ error, code, message, hint, status, documentation, detail? }` 형태입니다.

## CLI

```bash
npx daiso-finder-cli stores 강남
npx daiso-finder-cli products 11199 수세미 --json
npx daiso-finder-cli products 11199 수세미 --sandbox
```

소스는 [`cli/`](./cli) 에 있으며 `daiso-finder-cli` 이름으로 npm 에 배포합니다.

## API Route

외부 다이소 API는 모두 `src/app/api/` 의 Next.js Route 로 프록시됩니다.

- `GET /api/branches/search` — 키워드/좌표 기반 매장 검색
- `GET /api/branches/[code]` — 매장 단건 조회
- `GET /api/products` — 상품 검색 → 재고 확인 → 진열 위치 조회 (재고 있는 항목만 반환)
- `GET /api/products/[id]` — 상품 단건의 재고·진열 위치와 주변 매장 재고
- `GET /api/sandbox/**` — 외부 호출 없이 고정 픽스처로 응답
- 매칭되지 않는 `/api/**` 경로는 HTML 대신 JSON 404 를 반환

## 페이지

- `/` — 키워드/위치 기반 매장 선택, 무한 스크롤 + 서버 렌더링된 서비스 설명
- `/branch/[code]` — 매장 상세, 상품 검색 + 가격/재고/위치 표시
- `/developers` — 개발자 포털 (퀵스타트, 엔드포인트, 오류 코드, MCP, CLI, 샌드박스)
- `/about`, `/contact`, `/privacy` — 서비스 소개 / 문의 / 개인정보 처리방침

## 개발 규칙

- 패키지 매니저는 **pnpm** 만 사용 (npm/yarn 금지)
- 새 라이브러리 도입 전 `package.json` 확인 후 기존 의존성 우선 활용
- UI 는 [Tabler UI](https://docs.tabler.io/ui) 컴포넌트/유틸리티를 우선 사용
- Next.js 설정은 `next.config.js` 에 JSDoc 타입과 함께 작성
- 원격 이미지는 `cdn.daisomall.co.kr` 만 허용
