# 사용자 여정 계측 (Google Analytics 4)

"어떻게 들어와서(유입) → 뭘 하다가(퍼널) → 어디서 나갔는지(이탈)" 를 GA4 에서
재구성할 수 있도록 심어둔 이벤트 정리. 구현은 아래 네 파일에 모여 있다.

| 파일 | 역할 |
| --- | --- |
| `src/lib/gtag.ts` | dataLayer 부트스트랩, `trackEvent`, 기본 파라미터 설정 |
| `src/lib/journey.ts` | 유입 분류, 퍼널 단계 정의, 여정 상태(sessionStorage) |
| `src/hooks/useJourneyTracking.ts` | 페이지뷰·체류·스크롤·외부 링크·이탈 감지 |
| `src/components/JourneyEvent.tsx` | 서버 컴포넌트에서 이벤트 한 번 남기기 |

측정 ID 는 `NEXT_PUBLIC_GA_ID` 로 주입하며, 값이 없으면 모든 계측이 조용히
비활성화된다(로컬 개발에서 데이터가 섞이지 않는다).

## 1. 유입 — 어떻게 들어왔나

세션이 시작될 때 한 번 `app_entry` 를 보내고, 같은 값을 **이후 모든 이벤트의
기본 파라미터**로 붙인다(`gtag('set', …)`). 그래서 어떤 이벤트를 보든 그 사람이
어디서 들어온 사람인지 함께 보인다.

| 파라미터 | 설명 |
| --- | --- |
| `journey_id` | 세션 단위 여정 식별자 (sessionStorage) |
| `entry_path` | 처음 도착한 경로 (`/`, `/branch/11199` 등) |
| `entry_channel` | `direct` \| `organic_search` \| `social` \| `ai_assistant` \| `referral` \| `internal` \| UTM medium |
| `entry_source` | UTM source, 없으면 리퍼러 호스트 |
| `entry_medium`, `entry_campaign` | UTM 값 |
| `entry_referrer_host` | `www.` 를 뗀 리퍼러 호스트 |
| `display_mode` | `browser` \| `standalone` \| `minimal-ui` \| `fullscreen` (PWA 실행 여부) |
| `visitor_type` | `new` \| `returning` \| `unknown` (localStorage 기준) |
| `journey_step`, `journey_step_index`, `journey_max_step_index` | 이벤트 발생 시점의 퍼널 위치 |

`entry_channel` 분류는 `classifyChannel()` 이 담당한다. 네이버 블로그·카페는
검색 도메인을 공유하지만 `social` 로, `gemini.google.com` 은 구글 도메인이지만
`ai_assistant` 로 갈라 놓았다. 이 서비스는 AI 에이전트 유입을 따로 보는 것이
의미 있어서 어시스턴트를 별도 채널로 둔다.

## 2. 퍼널 — 뭘 했나

목적(원하는 상품의 매장 내 위치 확인)까지의 9단계. 단계를 밟을 때마다
`funnel_step` 이벤트 하나가 나가고, `step_index` 가 곧 퍼널 순번이다.

| # | `step_name` | 언제 |
| --- | --- | --- |
| 1 | `landing` | 세션 첫 페이지 도착 |
| 2 | `branch_search` | 매장 검색(키워드/현재 위치) 실행 |
| 3 | `branch_results` | 매장 검색 결과 도착 |
| 4 | `branch_view` | 매장 상세 도달 (클릭이든 검색엔진 직행이든) |
| 5 | `product_search` | 상품 검색 실행 |
| 6 | `product_results` | 상품 검색 결과 도착 |
| 7 | `product_view` | 상품 상세 도달 |
| 8 | `product_located` | 재고·진열 위치 확인 — **목적 달성** |
| 9 | `directions` | 카카오맵 길찾기 클릭 — 매장 방문 의사 |

`funnel_step` 공통 파라미터:

- `step_name`, `step_index`, `previous_step`, `previous_step_index`
- `is_step_forward` — 뒤로 돌아갔으면 `false`. 재검색·재시도 신호다.
- `is_step_repeat` — 같은 단계를 다시 밟았는지
- `seconds_since_entry`, `seconds_since_previous_step` — 어디서 오래 막혔는지
- 단계별 추가 값: `keyword`, `branch_code`, `result_count`, `stock`,
  `has_location`, `is_out_of_stock`, `search_mode`, `is_restored` 등

단계는 한 세션에서 여러 번 나올 수 있다(재검색, 뒤로가기). 퍼널 보고서에서는
`journey_id` 별 `journey_max_step_index` 로 "가장 멀리 간 지점" 을 보면 된다.

## 3. 이탈 — 어디서 나갔나

GA4 는 이탈 지점을 직접 알려주지 않으므로, 나가기 직전 상태를 직접 남긴다.

| 이벤트 | 언제 | 핵심 파라미터 |
| --- | --- | --- |
| `page_exit` | 화면이 가려지거나(`hidden`) 문서가 닫힐 때(`pagehide`) | `exit_path`, `reached_step`, `max_step_index`, `engaged_seconds`, `max_scroll_percent`, `exit_intent`, `exit_reason`, `hidden_count` |
| `page_engagement` | 사이트 안에서 다른 페이지로 이동할 때 | `page_path`, `to_path`, `engaged_seconds`, `max_scroll_percent` |
| `outbound_click` | 외부 도메인 링크 클릭 | `link_domain`, `link_url`, `link_text` |
| `scroll_depth` | 25/50/75/90% 도달 | `percent_scrolled` |

세션의 **마지막 `page_exit`** 가 곧 이탈 지점이다. `exit_intent` 는 직전 2초
안의 클릭으로 추정한 경로(`outbound` = 외부 링크로 나감, `internal`, `unknown`
= 그냥 닫음)이고, 탭 전환으로 잠깐 가려진 경우와 구분하려면 `hidden_count` 가
큰 마지막 이벤트를 보면 된다. 체류 시간(`engaged_seconds`)은 화면이 실제로
보이는 동안만 누적한다.

이탈 **원인**을 가르는 이벤트도 따로 있다.

| 이벤트 | 의미 |
| --- | --- |
| `search_result` (`is_empty`, `result_count`) | 검색 결과 0건 — 이 서비스에서 가장 흔한 이탈 원인 |
| `search_error` | 검색 실패(네트워크·업스트림 오류, 위치 권한 거부) |
| `product_detail_error` | 상세 재고 조회 실패 |
| `error_modal_view` | 전역 오류 모달 노출 |
| `app_error` | 화면이 통째로 깨짐 (`src/app/error.tsx`) |
| `page_not_found` | 없는 주소로 진입 |

## 4. 기존 클릭 이벤트

퍼널 계층과 별개로 세부 클릭 이벤트는 그대로 둔다(`branch_search`,
`branch_click`, `branches_load_more`, `recent_branch_click`,
`recent_branch_remove`, `product_search`, `product_detail_view`,
`product_load_more`, `other_branch_click`, `branch_address_click`,
`branch_address_copy`, `branch_directions_click`, `pwa_*`).
`branch_click` 과 `product_detail_view` 에는 `result_position` / `result_count`
가 붙어서 결과 목록의 몇 번째를 고르는지 볼 수 있다.

## 5. GA4 콘솔 등록 현황

맞춤 파라미터는 맞춤 측정기준/측정항목으로 등록해야 탐색 보고서에서 쓸 수 있다.
`daiso-finder` 속성(측정 ID `G-RK7N4R9G3G`)에 아래 26개가 **등록 완료**돼 있다.
위치: 관리 → 데이터 표시 → 맞춤 정의. 범위는 전부 `이벤트`.

### 맞춤 측정기준 18개

| 보고서에 보이는 이름 | 파라미터 |
| --- | --- |
| 유입 채널 | `entry_channel` |
| 유입 페이지 | `entry_path` |
| 유입 소스 | `entry_source` |
| 유입 리퍼러 호스트 | `entry_referrer_host` |
| 실행 모드 | `display_mode` |
| 방문자 유형 | `visitor_type` |
| 현재 여정 단계 | `journey_step` |
| 퍼널 단계 | `step_name` |
| 이전 단계 | `previous_step` |
| 단계 진행 여부 | `is_step_forward` |
| 이탈 페이지 | `exit_path` |
| 이탈 시 도달 단계 | `reached_step` |
| 이탈 방식 | `exit_intent` |
| 이탈 트리거 | `exit_reason` |
| 검색 유형 | `search_type` |
| 검색어 | `keyword` |
| 검색 결과 없음 | `is_empty` |
| 매장 코드 | `branch_code` |

### 맞춤 측정항목 8개

| 이름 | 파라미터 | 단위 |
| --- | --- | --- |
| 퍼널 단계 번호 | `step_index` | 일반 |
| 최대 도달 단계 | `max_step_index` | 일반 |
| 검색 결과 수 | `result_count` | 일반 |
| 결과 내 순번 | `result_position` | 일반 |
| 최대 스크롤 비율 | `max_scroll_percent` | 일반 |
| 재고 수량 | `stock` | 일반 |
| 체류 시간 | `engaged_seconds` | 초 |
| 진입 후 경과 시간 | `seconds_since_entry` | 초 |

`journey_id` 는 세션마다 값이 달라 카디널리티가 높으므로 측정기준으로 등록하지
않았다. 세션 단위 집계는 GA4 기본 `세션` 측정항목을 쓰면 된다. 나머지 파라미터
(`is_restored`, `hidden_count`, `link_domain`, `percent_scrolled` 등)도 필요해질
때 같은 방법으로 추가하면 된다. 할당량은 측정기준 18/50, 측정항목 8/50.

권장 보고서:

1. **유입별 성과** — 탐색 → 자유 형식. 행 `entry_channel`, 값 `journey_id`
   (고유 수)와 `product_located` 이벤트 수. 채널별로 목적 달성률이 갈린다.
2. **퍼널** — 탐색 → 유입경로 탐색 분석(또는 유입경로 분석). `funnel_step` 을
   `step_name` 순서대로 9단계로 놓으면 단계별 이탈률이 그대로 나온다.
3. **이탈 지점** — 자유 형식. 행 `reached_step` × `exit_path`, 값 `page_exit`
   이벤트 수. `exit_intent` 를 열로 두면 "그냥 닫음 vs 외부로 나감" 이 갈린다.
4. **빈 결과의 영향** — `search_result` 에서 `is_empty = true` 세그먼트를 만들고
   그 세션의 `page_exit` 를 보면 "못 찾아서 나간" 비율이 나온다.

`전환`으로 표시할 만한 이벤트: `product_located`(목적 달성),
`branch_directions_click`(매장 방문 의사), `pwa_installed`.

### 확인 필요: 향상된 측정의 페이지 변경 추적

데이터 스트림 → 향상된 측정 → 페이지 조회 → 고급 설정에 있는
**"브라우저 방문 기록 이벤트를 토대로 한 페이지 변경사항"** 이 켜져 있다.
이 앱은 `page_view` 를 직접 보내고(`src/lib/journey.ts`), 검색 조건도
`history.pushState` 로 URL 에 넣기 때문에 이 설정이 켜져 있으면
① SPA 이동마다 `page_view` 가 두 번 기록되고 ② 검색할 때마다 페이지뷰가
하나씩 더 붙는다. 수동 페이지뷰를 쓰는 SPA 의 표준 구성은 이 체크박스를
끄는 것이다.

## 6. 계측을 추가할 때

- 단계를 늘리려면 `JOURNEY_STEPS` 배열에 넣는다. 순번이 바뀌면 과거 데이터의
  `step_index` 와 어긋나므로, 중간 삽입보다 뒤에 붙이는 편이 안전하다.
- 개인정보는 보내지 않는다. 검색어(`keyword`)는 상품·지점명이라 남기지만,
  위치 검색은 좌표 대신 `(location)` 으로만 기록한다.
- 파라미터 값은 100자, 이벤트당 파라미터는 25개가 GA4 한도다. 긴 문자열은
  `slice(0, 100)` 해서 보낸다.
- 이벤트 이름을 새로 만들기 전에 기존 이름 + 파라미터로 표현할 수 있는지 본다
  (GA4 이벤트 이름은 속성당 500개 한도).
- `funnel_step` 은 `trackJourneyStep()` 으로만 보낸다. 상태(마지막 단계,
  최대 단계)를 함께 갱신해야 이탈 이벤트의 `reached_step` 이 맞는다.
