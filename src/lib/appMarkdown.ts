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
{"error":"매장 정보가 필요합니다.","code":"missing_parameter","message":"The \`branchCode\` query parameter is required.","hint":"Call GET /api/branches/search first ...","status":400,"documentation":"https://daiso-finder.kr/developers"}
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
  return `${APP_MARKDOWN}\n${introFor(path)}`;
}
