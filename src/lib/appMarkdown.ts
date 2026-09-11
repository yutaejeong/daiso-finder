import {
  CLI_PACKAGE_NAME,
  CONTACT_EMAIL,
  getBaseUrl,
  SITE_NAME,
  SITE_NAME_EN,
  SOURCE_REPOSITORY,
} from "@/lib/site";

/** 문서 안의 예시 URL 도 canonical 호스트를 쓴다. apex 는 www 로 리다이렉트된다. */
const BASE = getBaseUrl();

/**
 * `Accept: text/markdown` 협상 시 내려주는 앱 설명 본문.
 * 라우트 핸들러 파일에는 허용된 export 만 둘 수 있어 별도 모듈로 분리한다.
 */
const APP_MARKDOWN = `# Daiso Finder (다이소 파인더)

한국의 다이소 매장과 상품 재고를 검색하는 PWA 서비스입니다. API 키·가입 없이 쓰는 공개 REST API 와 MCP 서버를 함께 제공합니다.

## 언제 쓰나요 (when to use)

- 특정 다이소 매장에 그 상품이 지금 있는지 확인할 때
- 주소·지점명 또는 현재 좌표로 가까운 다이소 매장을 찾을 때
- 매장 안에서 상품이 몇 층 몇 번 구역에 진열돼 있는지 알아야 할 때
- 매장의 주소, 영업시간, 매장 코드가 필요할 때

이럴 때는 쓰지 마세요: 다이소가 아닌 매장, 한국 밖 매장, 온라인 주문·배송·결제, 매장을 정하지 않은 카탈로그 탐색.

## 기능

- **매장 검색**: 주소 또는 지점명으로 다이소 매장 검색
- **위치 기반 검색**: GPS 좌표로 주변 매장 검색 (무한 스크롤 지원)
- **상품 재고 확인**: 특정 매장의 상품 재고 수량 및 진열 위치(층/구역) 확인

## API 엔드포인트

인증이 필요 없습니다. API 키, 토큰, 가입 절차가 모두 없습니다.
전체 기계 판독 명세: \`/openapi.json\` (YAML: \`/openapi.yaml\`)

### 매장 검색

\`GET /api/branches/search\` — operationId \`searchStores\`

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| \`keyword\` | string | 검색할 주소 또는 지점명 |
| \`curLttd\` | number | 위도 (GPS 검색 시) |
| \`curLitd\` | number | 경도 (GPS 검색 시) |
| \`currentPage\` | number | 페이지 번호 (기본값: 1) |
| \`pageSize\` | number | 페이지당 결과 수 (기본값: 10) |

응답: \`[{ code, name, lat, lng, address, openTime, closeTime }]\`

### 매장 상세 조회

\`GET /api/branches/:code\` — operationId \`getStore\`

### 상품 재고 검색

\`GET /api/products\` — operationId \`searchStoreProducts\`

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| \`branchCode\` | string | 매장 코드 (/api/branches/search의 code 값) |
| \`keyword\` | string | 검색할 상품명 |
| \`currentPage\` | number | 페이지 번호 (기본값: 1) |
| \`stream\` | \`1\` | NDJSON 스트리밍 응답으로 진행률을 함께 받음 (선택) |

응답: \`{ products: [{ id, name, price, image, stock, stairNo, zoneNo }], hasMore, nextPage }\`

\`stream=1\` (또는 \`Accept: application/x-ndjson\`) 을 주면 한 줄에 하나씩 JSON 이벤트가 내려온다.
현재 매장에 재고가 있는 상품을 하나 확정할 때마다 \`progress\` 이벤트가 발생하고, 마지막에 \`result\` 이벤트가 위 응답과 동일한 본문을 담는다.

\`\`\`
{"type":"progress","found":3,"target":10,"percent":30,"page":1,"scanned":10}
{"type":"result","products":[...],"hasMore":true,"nextPage":2}
\`\`\`

### 상품 단건 조회

\`GET /api/products/:id?branchCode=\` — operationId \`getProductAvailability\`

응답: \`{ stock, stairNo, zoneNo, otherBranches: [{ code, name, address, stock, distanceKm }] }\`

## 오류 형식

모든 오류는 HTML 이 아닌 JSON 입니다.

\`\`\`json
{"error":"매장 정보가 필요합니다.","code":"missing_parameter","message":"The \`branchCode\` query parameter is required.","hint":"Call GET /api/branches/search first ...","status":400,"documentation":"${BASE}/developers"}
\`\`\`

## 에이전트 리소스

- 에이전트 사용 안내: \`/agent-instructions.md\`
- OpenAPI 스펙: \`/openapi.json\`, \`/openapi.yaml\`
- 개발자 포털: \`/developers\`
- 샌드박스 (고정 픽스처): \`/api/sandbox\`
- API 카탈로그: \`/.well-known/api-catalog\`
- MCP 서버: \`/api/mcp\` (Streamable HTTP, JSON-RPC POST, GET 메타데이터)
- MCP 매니페스트: \`/.well-known/mcp.json\`
- 에이전트 스킬: \`/.well-known/agent-skills/index.json\`
- llms.txt: \`/llms.txt\`
- CLI: \`npx daiso-finder-cli stores 강남\`
- WebMCP: 브라우저에서 \`document.modelContext\`가 제공되면 매장/상품 검색 도구를 등록합니다.
`;

/**
 * 신뢰·개발자 페이지의 Markdown 표현. HTML 라우트의 핵심 본문을 빠짐없이
 * 담아 `Accept: text/markdown` 클라이언트도 해당 페이지 자체를 읽게 한다.
 */
const CONTENT_PAGE_MARKDOWN: Record<string, string> = {
  "/about": `# ${SITE_NAME} 서비스 소개

${SITE_NAME}(${SITE_NAME_EN})는 전국 다이소 매장을 찾고 특정 매장의 상품 재고, 가격, 진열 위치를 확인하는 무료 오픈소스 웹 서비스입니다.

## 제공하는 기능

- 주소·지점명 또는 GPS 좌표로 다이소 매장 검색
- 매장 주소, 좌표, 영업시간, 후속 조회에 쓰는 매장 코드 확인
- 선택한 매장에서 재고가 있는 상품만 검색
- 상품 가격, 재고 수량, 진열 층과 구역 확인
- 같은 상품의 주변 매장 재고 확인

## 동작 방식

검색 요청이 들어오면 서버가 다이소몰 API를 호출해 필요한 값만 정리하여 반환합니다. 매장과 상품 데이터는 별도 데이터베이스에 복제하지 않으며 조회 시점의 응답을 사용합니다. 공개 REST API, MCP 서버, CLI도 같은 데이터 경로를 사용합니다.

## 데이터 정확도

재고와 진열 위치는 다이소몰이 제공하는 값이므로 실제 매장 상황과 시차가 있을 수 있습니다. 꼭 필요한 상품은 방문 전에 매장에 확인하세요.

## 운영 주체와 상표

${SITE_NAME}는 아성다이소의 공식 서비스가 아닌 개인 오픈소스 프로젝트입니다. 다이소 상품의 구매, 교환·환불 및 매장 운영 문의는 다이소 공식 고객센터를 이용해야 합니다.

소스 코드: ${SOURCE_REPOSITORY}

## 관련 문서

- [개발자 포털](/developers)
- [문의](/contact)
- [개인정보 처리방침](/privacy)
`,
  "/contact": `# ${SITE_NAME} 문의

서비스 오류, 데이터 문제, API·MCP 연동 문의와 권리 침해·삭제 요청은 아래 공개 이메일 또는 GitHub 이슈로 보내주세요.

- 이메일: ${CONTACT_EMAIL}
- GitHub 이슈: ${SOURCE_REPOSITORY}/issues

## 문의할 때 포함할 정보

- 문제가 발생한 페이지 또는 API URL
- 매장 코드와 검색어 또는 상품 번호
- 발생 시각과 HTTP 상태 코드
- API 오류 응답의 \`code\`, \`hint\`, \`detail\` 필드
- 가능한 경우 재현 절차와 화면 캡처

API 키 발급이나 사용 승인은 필요하지 않습니다. 공개 API는 인증 없이 바로 사용할 수 있으며 전체 스펙은 \`/openapi.json\`에 있습니다. AI 에이전트는 \`/api/mcp\`를 Streamable HTTP 서버로 등록할 수 있습니다.

${SITE_NAME}는 아성다이소의 공식 서비스가 아니므로 구매, 교환·환불, 매장 운영 문의는 다이소 공식 고객센터로 연락해야 합니다.
`,
  "/privacy": `# ${SITE_NAME} 개인정보 처리방침

${SITE_NAME}는 회원 가입이 없고 이름, 연락처, 결제 수단 같은 개인정보를 자체 데이터베이스에 저장하지 않습니다.

## 위치 정보

주변 매장 검색을 선택하면 브라우저가 위치 정보 제공 동의를 요청합니다. 허용된 좌표는 해당 검색 요청에서 가까운 매장을 조회하는 데 사용되며, 동의하지 않아도 주소나 지점명으로 검색할 수 있습니다.

## 브라우저에 저장되는 정보

- 최근 본 매장 목록은 브라우저의 로컬 저장소에 저장됩니다.
- PWA 설치 안내 등 일부 화면 상태도 브라우저에 저장될 수 있습니다.
- 최근 매장 항목의 삭제 버튼이나 브라우저 저장소 삭제 기능으로 제거할 수 있습니다.

## 외부 서비스로 전달되는 정보

- 다이소몰 API: 검색어, 매장 코드, 상품 번호와 좌표를 매장·재고 조회에 사용합니다.
- Google Analytics: 설정된 배포에서는 페이지 조회와 검색·클릭 같은 사용 이벤트를 수집할 수 있습니다.
- 호스팅 사업자: 서비스 제공과 보안을 위해 IP 주소, 사용자 에이전트와 요청 URL 등의 접속 로그가 일시적으로 기록될 수 있습니다.

## 공개 API와 MCP

\`/api\` 이하 공개 API와 \`/api/mcp\`는 인증 없이 호출됩니다. \`/api/sandbox\`는 고정 fixture만 반환하고 외부 다이소 API를 호출하지 않습니다.

개인정보 처리 문의: ${CONTACT_EMAIL}
`,
  "/developers": `# ${SITE_NAME} 개발자 포털

${SITE_NAME_EN} API는 API 키, 가입, 승인 절차 없이 무료로 호출할 수 있습니다.

## 1분 퀵스타트

\`\`\`bash
# 1. 매장 검색
curl "${BASE}/api/branches/search?keyword=강남"

# 2. 매장 코드로 상품 재고 검색
curl "${BASE}/api/products?branchCode=11199&keyword=수세미"

# 3. 상품 단건 재고와 진열 위치
curl "${BASE}/api/products/1019373?branchCode=11199"
\`\`\`

## 인증과 사용량

- 인증, API 키, 토큰, OAuth가 필요하지 않습니다.
- 요금제와 유료 등급이 없습니다.
- 고정 한도는 없지만 자동화 요청은 초당 수 건 수준으로 유지하세요.
- 매장 정보는 캐시할 수 있지만 재고 수량은 오래 캐시하지 마세요.

## REST 엔드포인트

- \`GET /api\`: 전체 엔드포인트와 발견 문서 인덱스
- \`GET /api/branches/search\`: 키워드 또는 GPS 좌표로 매장 검색
- \`GET /api/branches/{code}\`: 매장 단건 조회
- \`GET /api/products\`: 매장 내 재고 상품 검색
- \`GET /api/products/{id}\`: 상품 재고, 진열 위치와 주변 매장 재고
- \`GET|POST /api/mcp\`: MCP Streamable HTTP 엔드포인트

## 샌드박스

\`/api/sandbox\` 이하 경로는 외부 API를 호출하지 않고 고정 데이터를 반환합니다.

\`\`\`bash
curl "${BASE}/api/sandbox/branches/search?keyword=강남"
curl "${BASE}/api/sandbox/products?branchCode=11199&keyword=수세미"
curl "${BASE}/api/sandbox/products/1019373?branchCode=11199"
\`\`\`

## 오류 응답

모든 API 실패는 \`{ error, code, message, hint, status, documentation, detail? }\` 형태의 JSON입니다. 지원하지 않는 메서드는 \`method_not_allowed\`, 누락된 파라미터는 \`missing_parameter\`를 반환합니다.

## MCP

\`${BASE}/api/mcp\`를 원격 Streamable HTTP MCP 서버로 등록할 수 있습니다. \`search_stores\`, \`search_nearby_stores\`, \`get_store\`, \`search_products\`, \`get_product_availability\` 도구를 제공합니다.

## CLI

\`\`\`bash
npx ${CLI_PACKAGE_NAME} stores 강남
npx ${CLI_PACKAGE_NAME} products 11199 수세미 --json
npx ${CLI_PACKAGE_NAME} product 1019373 11199 --sandbox
\`\`\`

## 기계 판독 문서

- OpenAPI: \`/openapi.json\`, \`/openapi.yaml\`
- API 인덱스: \`/api\`
- 에이전트 안내: \`/agent-instructions.md\`, \`/llms.txt\`
- MCP 매니페스트: \`/.well-known/mcp.json\`
- API 카탈로그: \`/.well-known/api-catalog\`
- 에이전트 스킬: \`/.well-known/agent-skills/index.json\`

지원: ${CONTACT_EMAIL} 또는 ${SOURCE_REPOSITORY}/issues
`,
};

/** 경로별 머리말. 어떤 페이지의 Markdown 표현인지 알려준다. */
const PAGE_INTROS: Record<string, string> = {
  "/": "현재 페이지: 홈 — 매장 검색\n",
  "/developers":
    "현재 페이지: 개발자 포털 (/developers) — 퀵스타트, 엔드포인트, 오류 코드, MCP, CLI, 샌드박스 안내\n",
  "/about":
    "현재 페이지: 서비스 소개 (/about) — 서비스 목적, 데이터 출처, 운영 주체\n",
  "/contact": "현재 페이지: 문의 (/contact) — 버그 제보와 연동 문의 창구\n",
  "/privacy":
    "현재 페이지: 개인정보 처리방침 (/privacy) — 수집하지 않는 정보와 외부 전달 범위\n",
};

function introFor(path: string) {
  if (path.startsWith("/branch/")) {
    return `현재 페이지: 매장 상세 (${path})\n`;
  }

  return PAGE_INTROS[path] ?? `현재 페이지: ${path}\n`;
}

export function buildMarkdownForPath(path: string) {
  const pageMarkdown = CONTENT_PAGE_MARKDOWN[path];
  return `${pageMarkdown ?? APP_MARKDOWN}\n${introFor(path)}`;
}
