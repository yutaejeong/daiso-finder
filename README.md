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
| `pnpm prepare` | PandaCSS 코드 생성 (`styled-system/` 갱신) |

## 환경 변수

`.env.local.example` 을 복사해 `.env.local` 로 사용합니다. 모든 값은 `NEXT_PUBLIC_*` 으로 클라이언트에 노출되는 공개 값이며, 시크릿은 포함되어 있지 않습니다.

| 키 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | 다이소 외부 API 베이스 URL |
| `NEXT_PUBLIC_APP_URL` | 배포 도메인 (sitemap, canonical URL 등에 사용) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 측정 ID |

## API Route

외부 다이소 API는 모두 `src/app/api/` 의 Next.js Route 로 프록시됩니다.

- `GET /api/branches/search` — 키워드/좌표 기반 매장 검색
- `GET /api/branches/[code]` — 매장 단건 조회
- `GET /api/products` — 상품 검색 → 재고 확인 → 진열 위치 조회 (재고 있는 항목만 반환)

## 페이지

- `/` — 키워드/위치 기반 매장 선택, 무한 스크롤
- `/branch/[code]` — 매장 상세, 상품 검색 + 가격/재고/위치 표시

## 개발 규칙

- 패키지 매니저는 **pnpm** 만 사용 (npm/yarn 금지)
- 새 라이브러리 도입 전 `package.json` 확인 후 기존 의존성 우선 활용
- UI 는 [Tabler UI](https://docs.tabler.io/ui) 컴포넌트/유틸리티를 우선 사용
- Next.js 설정은 `next.config.js` 에 JSDoc 타입과 함께 작성
- 원격 이미지는 `cdn.daisomall.co.kr` 만 허용
