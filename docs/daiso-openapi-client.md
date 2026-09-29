# Daiso OpenAPI Client Generation

이 프로젝트는 Daiso FrontOffice OpenAPI JSON에서 서버사이드 API 호출 함수를 생성한다.

## 선택한 도구

`orval`을 사용한다.

| 후보 | 장점 | 단점 | 판단 |
| --- | --- | --- | --- |
| `@openapitools/openapi-generator-cli` | 언어/프레임워크 지원이 넓고 `typescript-fetch` 생성기가 안정적으로 제공됨 | Java 런타임이 필요하고 생성물이 비교적 큼 | 전체 SDK가 필요한 상황에는 좋지만, Next.js route handler에서 5개 endpoint만 쓰는 현재 범위에는 과함 |
| `orval` | Node 기반, fetch 함수 생성 지원, operationId 기반 함수명이 자연스럽고 설정이 단순함 | Daiso 명세처럼 응답 schema가 `object`로 뭉개진 endpoint는 기존 방어 파싱 타입이 여전히 필요함 | 서버 route에서 호출할 얇은 함수 생성 목적에 가장 적합 |
| `openapi-typescript` + `openapi-fetch` | 런타임이 작고 타입 안정성이 좋음 | named API 함수가 생성되지는 않고 path 기반 client 호출을 직접 작성해야 함 | 요구사항의 "API 호출 함수 생성"에는 Orval이 더 직접적 |
| `swagger-typescript-api` | fetch/axios 클라이언트 생성 가능 | 프로젝트 설정과 생성물 제어가 Orval보다 덜 맞음 | 대안으로 가능하지만 Orval 대비 이점이 작음 |

## 생성 흐름

```bash
pnpm generate:daiso-api
```

1. `scripts/prepare-daiso-openapi.mjs`가 `https://fapi.daisomall.co.kr/v3/api-docs`를 다운로드한다.
2. 앱에서 쓰는 5개 path만 `openapi/daiso.filtered.json`으로 추출한다.
3. Orval이 `src/generated/daiso/client.ts`와 `src/generated/daiso/model/*`를 생성한다.
4. 생성 함수는 `src/lib/daisoApiClient.ts`의 `daisoFetch` mutator를 통해 런타임 `DAISO_API_URL` 또는 `NEXT_PUBLIC_API_URL`로 호출된다. `www.daisomall.co.kr`처럼 프론트 사이트 host가 들어오면 API host인 `fapi.daisomall.co.kr`로 보정한다.

## 현재 포함한 Daiso endpoint

- `POST /ms/msg/selStr`
- `POST /pdo/pdThumbSel`
- `POST /pdo/pdThumbSelSimple`
- `POST /pdo/selOfflStrStck` (더 이상 쓰지 않음, 아래 참고)
- `POST /pdo/selPdStDispInfo` (더 이상 쓰지 않음, 아래 참고)

## 매장 재고·진열 조회 (사전 인증)

2026-09 다이소가 매장 재고·진열 조회를 인증 뒤로 옮겼다. 위 두 endpoint 는 무엇을 보내도
500 을 돌려주고, `/v3/api-docs` 도 404 라 orval 로 다시 생성할 수 없다. 그래서
`src/lib/daisoStock.ts` 가 다이소몰 웹과 같은 방식으로 손으로 호출한다.

- `POST /pd/pdh/selStrPkupStck` — 본문 `[{ pdNo, strCd }]`, 응답 형식은 예전 재고 조회와 같다.
  다이소가 모르는 상품은 응답에서 빠진다.
- `POST /pdo/selIntPdStDispInfo` — 본문 `{ pdNo, strCd }`, 응답 `data[0].stairNo/zoneNo`.

두 요청 모두 먼저 `GET /auth/request` 로 JWT 와 `X-DM-UID` 를 받고, JWT 를
AES-128-CBC(키 `PRE_AUTH_ENC_KEY`, 임의 IV)로 암호화해
`Authorization: Bearer base64(IV)+base64(암호문)` 으로 보낸다. JWT 는 요청한 IP·User-Agent 에
묶이고 30초 뒤 만료되므로 20초만 재사용하고, 401/403 이 오면 한 번 새로 받아 다시 보낸다.

다이소몰 번들이 바뀌면 이 방식도 다시 깨질 수 있다. 그때는 다이소몰 상품 페이지의 JS 에서
`postWithAuth` 를 찾아 비교한다.
