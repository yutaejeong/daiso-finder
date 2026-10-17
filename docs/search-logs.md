# 검색어·조회 수집 (구글 스프레드시트 + Vercel 로그)

사용자가 입력한 검색어와 매장·상품 상세 조회를 구글 스프레드시트에 한 줄씩
쌓는다. 같은 행은 Vercel 런타임 로그에도 JSON 한 줄로 남는다. 조회 행은 나중에
인기 매장·인기 상품을 뽑는 원천이다(아직 화면에 보여주지는 않는다).

| 종류           | 어디서                         | 언제                         |
| -------------- | ------------------------------ | ---------------------------- |
| `branch`       | `GET /api/branches/search`     | 키워드로 매장을 검색할 때    |
| `product`      | `GET /api/products`            | 매장 안에서 상품을 검색할 때 |
| `branch_view`  | `POST /api/views` (웹 UI 비콘) | 매장 상세 화면을 열 때       |
| `product_view` | `POST /api/views` (웹 UI 비콘) | 상품 상세 화면을 열 때       |

구현은 `src/lib/searchLog.ts` 한 곳에 모여 있다. 검색 라우트는 결과를 만든
직후에 `logSearch()` 를, `/api/views` 는 `logView()` 를 부른다. 쓰기는 구글 Apps
Script 웹앱이 대신 하므로 앱 쪽에는 추가 의존성이 없다.

## 수집 규칙

- **검색어가 있을 때만** 기록한다. 위치 기반 매장 검색은 검색어가 없으므로 남기지
  않는다(이건 GA4 의 `branch_location_search` 로 이미 보인다).
- **첫 페이지만** 기록한다. 무한 스크롤이나 "더 보기" 로 이어지는 다음 페이지는
  같은 검색의 연장이라 중복으로 쌓지 않는다.
- 결과가 0건이어도 기록한다. 오히려 "찾았는데 없던 검색어" 가 가장 쓸모 있다.
- 상류 API 오류로 끝난 검색은 `status = error` 로 남긴다.
- IP, User-Agent, 쿠키 같은 식별 가능한 값은 보내지 않는다.
- 기록은 부가 기능이라 검색 응답을 막지 않는다. 웹훅이 느리거나 실패해도 사용자
  응답에는 아무 영향이 없고, 환경변수가 없으면 조용히 꺼진다.

### 조회 기록 규칙

- 조회는 **웹 UI 에서만** 온다. `src/lib/viewBeacon.ts` 가 상세 화면이 열릴 때
  `navigator.sendBeacon` 으로 `POST /api/views` 를 보낸다. 그래서 유입 경로는 늘
  `web` 이다. API·MCP 로 상품을 조회한 호출은 세지 않는다.
- API 응답 수를 세지 않는 이유: 상세 화면의 React Query 는 창에 다시 포커스가 올
  때마다 재요청해서, 응답 수가 실제 조회보다 크게 부풀려진다.
- **같은 탭 세션에서 같은 화면은 한 번만** 보낸다(`sessionStorage`). 뒤로 가기나
  새로고침으로 다시 열어도 한 번으로 센다. 그래서 조회 수는 "그 화면을 연 세션
  수" 에 가깝다.
- 검색엔진 크롤러(`User-Agent` 판별)와 다른 사이트에서 쏜 요청
  (`Sec-Fetch-Site: cross-site`)은 기록하지 않는다. `User-Agent` 는 판별에만 쓰고
  저장하지 않는다.
- 매장 코드·상품 번호는 영숫자 32자 이내만 받는다. `상품명` 은 화면에 보인 값을
  사람이 시트를 읽기 편하라고 같이 남기는 것이라, 집계할 때는 **상품 번호를
  기준**으로 묶고 화면에 보일 이름은 그때 서버에서 다시 조회한다(누구나 보낼 수
  있는 값이라 그대로 믿으면 안 된다).

### 열 구성

| 열          | 값                                                                           |
| ----------- | ---------------------------------------------------------------------------- |
| `시각`      | 검색·조회가 일어난 시각                                                      |
| `검색 종류` | `branch` \| `product` \| `branch_view` \| `product_view`                     |
| `검색어`    | 사용자가 입력한 문자열 (최대 200자). 조회 행은 빈 값                         |
| `매장 코드` | 상품 검색·조회면 그 매장 코드, 매장 조회면 연 매장 코드, 매장 검색이면 빈 값 |
| `결과 수`   | 응답에 담긴 건수. 오류거나 조회 행이면 빈 값                                 |
| `유입 경로` | `web`(사이트 화면) \| `api`(공개 API·MCP·CLI 직접 호출)                      |
| `상태`      | `ok` \| `error`                                                              |
| `상품 번호` | `product_view` 행의 상품 번호                                                |
| `상품명`    | `product_view` 행에서 화면에 보인 상품명 (최대 200자)                        |

`상품 번호`·`상품명` 은 조회 기록을 추가하면서 **맨 뒤에 붙인** 열이다. 앞의 7열은
그대로라 이미 쌓인 행과 섞여도 어긋나지 않는다.

`유입 경로` 는 웹 UI 가 요청에 붙이는 `x-search-source: web` 헤더로 구분한다.
헤더가 없는 호출은 전부 `api` 로 본다.

## 설정 순서

### 1. 스프레드시트 만들기

구글 드라이브에서 스프레드시트를 하나 새로 만든다. 시트 이름은 그대로 둬도 되고,
아래 스크립트가 `searches` 시트를 알아서 만들고 머리글도 채운다.

### 2. Apps Script 붙이기

스프레드시트에서 **확장 프로그램 → Apps Script** 를 연다. 기본으로 열리는
`Code.gs` 내용을 아래로 통째로 바꾼다.

```js
/** 검색어가 쌓일 시트 이름 */
const SHEET_NAME = "searches";

/**
 * 아무나 이 웹앱 주소로 쓰레기 값을 넣지 못하게 막는 공유 비밀값.
 * 아래 값을 길고 임의적인 문자열로 바꾼 뒤, 앱의
 * SEARCH_LOG_WEBHOOK_TOKEN 환경변수에 똑같이 넣는다.
 */
const TOKEN = "여기에-임의의-긴-문자열";

const HEADERS = [
  "시각",
  "검색 종류",
  "검색어",
  "매장 코드",
  "결과 수",
  "유입 경로",
  "상태",
  "상품 번호",
  "상품명",
];

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (error) {
    return json({ ok: false, error: "invalid_json" });
  }

  if (TOKEN && payload.token !== TOKEN) {
    return json({ ok: false, error: "forbidden" });
  }

  var rows = payload.rows || [];
  if (!rows.length) {
    return json({ ok: true, appended: 0 });
  }

  // 동시에 들어온 검색이 같은 줄을 덮어쓰지 않도록 잠근다.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    var values = rows.map(function (row) {
      return [
        row.timestamp ? new Date(row.timestamp) : new Date(),
        row.type || "",
        row.keyword || "",
        row.branchCode || "",
        row.resultCount === 0 || row.resultCount ? row.resultCount : "",
        row.source || "",
        row.status || "",
        row.productId || "",
        row.productName || "",
      ];
    });
    sheet
      .getRange(sheet.getLastRow() + 1, 1, values.length, HEADERS.length)
      .setValues(values);
    return json({ ok: true, appended: values.length });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("yyyy-MM-dd HH:mm:ss");
    // 상품 번호는 숫자로 바뀌면 앞자리 0 이 사라지므로 글자로 둔다.
    sheet.getRange("H:H").setNumberFormat("@");
  } else if (sheet.getLastColumn() < HEADERS.length) {
    // 예전(7열) 스크립트로 만든 시트라면 새 열의 머리글을 덧붙인다.
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange("H:H").setNumberFormat("@");
  }
  return sheet;
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
```

`TOKEN` 값을 길고 임의적인 문자열로 바꾼 뒤 저장한다.

### 3. 웹앱으로 배포

**배포 → 새 배포 → 유형 선택(톱니) → 웹 앱** 을 고르고

- **다음 사용자로 실행**: 나
- **액세스 권한이 있는 사용자**: 모든 사용자

로 배포한다. 첫 배포에서는 구글 권한 승인 화면이 뜬다. 배포가 끝나면 나오는
`https://script.google.com/macros/s/…/exec` 주소를 복사한다.

> 액세스를 "모든 사용자" 로 두는 이유는 앱 서버가 구글 계정 없이 호출하기
> 때문이다. 실제 쓰기는 `TOKEN` 이 맞을 때만 일어난다.

### 4. 환경변수 넣기

`.env.local` (그리고 배포 환경의 환경변수)에 넣는다.

```
SEARCH_LOG_WEBHOOK_URL=https://script.google.com/macros/s/AKfy.../exec
SEARCH_LOG_WEBHOOK_TOKEN=Apps Script 의 TOKEN 과 같은 값
```

`SEARCH_LOG_WEBHOOK_URL` 이 비어 있으면 수집 전체가 꺼진다. 로컬 개발에서
스프레드시트를 더럽히고 싶지 않으면 그냥 비워두면 된다.

### 5. 확인

개발 서버를 띄우고 한 번 검색해 본 뒤 스프레드시트에 줄이 늘어나는지 본다.
터미널로 직접 찔러볼 수도 있다.

```bash
curl "http://localhost:3000/api/branches/search?keyword=%EA%B0%95%EB%82%A8"
```

줄이 안 늘어나면 서버 로그에 `검색어 기록 실패:` 가 찍혔는지 먼저 확인한다.
`forbidden` 이면 토큰이 다른 것이고, 응답 자체가 없으면 배포 설정의 액세스
권한을 다시 본다.

## 이미 운영 중인 시트에 조회 기록 붙이기

예전 7열 스크립트를 쓰고 있었다면, 앱을 배포하기 **전에** 위 스크립트로
`Code.gs` 를 바꾸고 새 버전으로 다시 배포한다(아래 "스크립트를 고칠 때"). 예전
스크립트는 모르는 필드를 버리기 때문에, 순서가 바뀌면 그사이 들어온 조회 행은
`상품 번호`·`상품명` 이 빈 채로 쌓인다. 첫 행이 들어올 때 머리글 두 칸이 자동으로
붙는다. 웹훅 주소와 토큰은 그대로다.

## 스크립트를 고칠 때

Apps Script 를 수정한 뒤에는 **배포 → 배포 관리 → 수정(연필) → 버전: 새 버전**
으로 다시 배포해야 `exec` 주소에 반영된다. 저장만 해서는 바뀌지 않는다.

## Vercel 같은 서버리스 환경

응답을 보낸 뒤 인스턴스가 정리되면 전송이 중간에 끊길 수 있어서,
`src/lib/searchLog.ts` 는 Vercel request context 의 `waitUntil` 이 있으면 거기에
전송을 맡긴다. `next start` 로 직접 띄우는 환경에서는 프로세스가 계속 살아 있어
그대로 완료된다.

## Vercel 런타임 로그

시트와 같은 행이 표준 출력에 JSON 한 줄로도 나간다. Vercel 은 이 줄을 런타임
로그로 모으므로, 시트 웹훅이 꺼져 있거나 실패해도 기록이 남는다.

```json
{
  "log": "daiso_finder_activity",
  "timestamp": "2026-10-17T01:02:03.000Z",
  "type": "product_view",
  "keyword": "",
  "branchCode": "11199",
  "resultCount": "",
  "source": "web",
  "status": "ok",
  "productId": "1019373",
  "productName": "물티슈"
}
```

- 켜고 끄기: `SEARCH_LOG_CONSOLE=1`(켜기) / `0`(끄기). 값이 없으면 Vercel 에서 돌
  때(`VERCEL` 환경변수가 있을 때)만 켜진다. 로컬 `pnpm dev` 터미널은 조용하다.
- 보기: Vercel 대시보드 → 프로젝트 → **Logs** 에서 `daiso_finder_activity` 로
  검색한다. CLI 로는 `vercel logs <배포 URL>`.
- **보관 기간이 짧다.** 런타임 로그는 플랜에 따라 1시간~1일 정도만 남는다.
  오래 쌓아 두는 저장소는 스프레드시트이고, Vercel 쪽을 길게 보관하려면
  **Log Drains**(Pro 이상)로 외부 로그 저장소에 내보내야 한다. 드레인에서
  `"log":"daiso_finder_activity"` 줄만 걸러 받으면 된다.
