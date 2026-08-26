# auth.md

> 다이소 파인더(Daiso Finder) API 는 인증 없이 사용 가능한 공개 API 입니다. 에이전트 등록이 필요하지 않습니다.

## 에이전트 대상

한국 다이소 매장 검색 및 상품 재고 조회가 필요한 모든 AI 에이전트에게 공개.

## 인증 방식

**익명 (Anonymous)** — 별도 인증 없이 모든 엔드포인트에 접근 가능. API 키, 토큰, 등록, 결제 수단 등록 모두 불필요.

| 항목 | 값 |
|---|---|
| 인증 유형 | 없음 (anonymous) |
| API 키 발급 | 불필요 |
| 요금 | 무료, 유료 등급 없음 |
| 셀프 서비스 | 예 — 승인이나 영업 문의 절차 없음 |
| 샌드박스 | `GET /api/sandbox` (고정 픽스처, 외부 호출 없음) |
| 사용량 한도 | 강제 한도 없음. 초당 수 건 수준 권장 |
| CORS | 발견 문서·샌드박스 응답은 `Access-Control-Allow-Origin: *` |

## API 엔드포인트

| 엔드포인트 | operationId | 설명 |
|---|---|---|
| `GET /api` | `getApiIndex` | 엔드포인트·발견 문서 인덱스 |
| `GET /api/branches/search` | `searchStores` | 키워드 또는 GPS 기반 매장 검색 |
| `GET /api/branches/{code}` | `getStore` | 매장 단건 조회 |
| `GET /api/products?branchCode=&keyword=` | `searchStoreProducts` | 매장 내 상품 재고 및 진열 위치 검색 |
| `GET /api/products/{id}?branchCode=` | `getProductAvailability` | 상품 단건 재고·진열 위치·주변 매장 재고 |
| `POST /api/mcp` | `callMcp` | MCP Streamable HTTP JSON-RPC 엔드포인트 |
| `GET /api/mcp` | `getMcpServerInfo` | MCP 서버 메타데이터 |

## 오류 응답

모든 오류는 HTML 이 아닌 JSON 이며 `code` 로 분기할 수 있습니다.

```json
{
  "error": "매장 정보가 필요합니다.",
  "code": "missing_parameter",
  "message": "The `branchCode` query parameter is required.",
  "hint": "Call GET /api/branches/search first and pass the `code` field ...",
  "status": 400,
  "documentation": "https://daiso-finder.kr/developers"
}
```

## 에이전트 리소스

- OpenAPI 스펙: `/openapi.json`, `/openapi.yaml`
- 개발자 포털: `/developers`
- 에이전트 사용 안내: `/agent-instructions.md`
- API 카탈로그: `/.well-known/api-catalog`
- MCP 매니페스트: `/.well-known/mcp.json`
- MCP 서버 카드: `/.well-known/mcp/server-card.json`
- 에이전트 스킬 목록: `/.well-known/agent-skills/index.json`
- 앱 설명 (Markdown): `/md`
