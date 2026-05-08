import { NextRequest } from "next/server";

const APP_MARKDOWN = `# Daiso Finder

한국의 다이소 매장과 상품 재고를 검색하는 PWA 서비스입니다.

## 기능

- **매장 검색**: 주소 또는 지점명으로 다이소 매장 검색
- **위치 기반 검색**: GPS 좌표로 주변 매장 검색 (무한 스크롤 지원)
- **상품 재고 확인**: 특정 매장의 상품 재고 수량 및 진열 위치(층/구역) 확인

## API 엔드포인트

### 매장 검색

\`GET /api/branches/search\`

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| \`keyword\` | string | 검색할 주소 또는 지점명 |
| \`curLttd\` | number | 위도 (GPS 검색 시) |
| \`curLitd\` | number | 경도 (GPS 검색 시) |
| \`currentPage\` | number | 페이지 번호 (기본값: 1) |
| \`pageSize\` | number | 페이지당 결과 수 (기본값: 10) |

응답: \`[{ code, name, lat, lng, address, openTime, closeTime }]\`

### 매장 상세 조회

\`GET /api/branches/:code\`

### 상품 재고 검색

\`GET /api/products\`

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| \`branchCd\` | string | 매장 코드 (/api/branches/search의 code 값) |
| \`keyword\` | string | 검색할 상품명 |

응답: \`{ products: [{ id, name, price, image, stock, stairNo, zoneNo }], hasMore, nextPage }\`

## 에이전트 리소스

- API 카탈로그: \`/.well-known/api-catalog\`
- MCP 서버: \`/api/mcp\`
- 에이전트 스킬: \`/.well-known/agent-skills/index.json\`
`;

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  const markdown = path.startsWith("/branch/")
    ? APP_MARKDOWN + `\n현재 페이지: 매장 상세 (${path})\n`
    : APP_MARKDOWN;

  const byteLen = new TextEncoder().encode(markdown).length;

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(Math.ceil(byteLen / 4)),
    },
  });
}
