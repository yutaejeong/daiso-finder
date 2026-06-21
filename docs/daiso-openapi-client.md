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
4. 생성 함수는 `src/lib/daisoApiClient.ts`의 `daisoFetch` mutator를 통해 런타임 `NEXT_PUBLIC_API_URL`로 호출된다.

## 현재 포함한 Daiso endpoint

- `POST /ms/msg/selStr`
- `POST /pdo/pdThumbSel`
- `POST /pdo/pdThumbSelSimple`
- `POST /pdo/selOfflStrStck`
- `POST /pdo/selPdStDispInfo`
