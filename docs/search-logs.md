# 검색어 수집 (구글 스프레드시트)

사용자가 입력한 검색어를 구글 스프레드시트에 한 줄씩 쌓는다. 모으는 검색은 두
가지다.

| 종류      | 어디서                     | 언제                         |
| --------- | -------------------------- | ---------------------------- |
| `branch`  | `GET /api/branches/search` | 키워드로 매장을 검색할 때    |
| `product` | `GET /api/products`        | 매장 안에서 상품을 검색할 때 |

구현은 `src/lib/searchLog.ts` 한 곳에 모여 있고, 위 두 라우트가 결과를 만든
직후에 `logSearch()` 를 부른다. 쓰기는 구글 Apps Script 웹앱이 대신 하므로 앱
쪽에는 추가 의존성이 없다.

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

### 열 구성

| 열          | 값                                                                 |
| ----------- | ------------------------------------------------------------------ |
| `시각`      | 검색이 일어난 시각                                                 |
| `검색 종류` | `branch` \| `product`                                              |
| `검색어`    | 사용자가 입력한 문자열 (최대 200자)                                |
| `매장 코드` | 상품 검색이면 검색한 매장 코드, 매장 검색이면 빈 값                |
| `결과 수`   | 응답에 담긴 건수. 오류면 빈 값                                     |
| `유입 경로` | `web`(사이트 화면에서의 검색) \| `api`(공개 API·MCP·CLI 직접 호출) |
| `상태`      | `ok` \| `error`                                                    |

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

## 스크립트를 고칠 때

Apps Script 를 수정한 뒤에는 **배포 → 배포 관리 → 수정(연필) → 버전: 새 버전**
으로 다시 배포해야 `exec` 주소에 반영된다. 저장만 해서는 바뀌지 않는다.

## Vercel 같은 서버리스 환경

응답을 보낸 뒤 인스턴스가 정리되면 전송이 중간에 끊길 수 있어서,
`src/lib/searchLog.ts` 는 Vercel request context 의 `waitUntil` 이 있으면 거기에
전송을 맡긴다. `next start` 로 직접 띄우는 환경에서는 프로세스가 계속 살아 있어
그대로 완료된다.
