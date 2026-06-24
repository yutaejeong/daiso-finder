# auth.md

> 다이소 파인더 API는 인증 없이 사용 가능한 공개 API입니다. 에이전트 등록이 필요하지 않습니다.

## 에이전트 대상

한국 다이소 매장 검색 및 상품 재고 조회가 필요한 모든 AI 에이전트에게 공개.

## 인증 방식

**익명 (Anonymous)** — 별도 인증 없이 모든 엔드포인트에 접근 가능. API 키, 토큰, 등록 불필요.

## API 엔드포인트

| 엔드포인트 | 설명 |
|---|---|
| `GET /api/branches/search` | 키워드 또는 GPS 기반 매장 검색 |
| `GET /api/branches/[code]` | 매장 단건 조회 |
| `GET /api/products?branchCode=&keyword=` | 매장 내 상품 재고 및 진열 위치 검색 |
| `POST /api/mcp` | MCP JSON-RPC 엔드포인트 |
| `GET /api/mcp` | MCP 도구 메타데이터 |

## 에이전트 리소스

- API 카탈로그: `/.well-known/api-catalog`
- 에이전트 스킬 목록: `/.well-known/agent-skills/index.json`
- MCP 서버 카드: `/.well-known/mcp/server-card.json`
- 앱 설명 (Markdown): `/md`
