/**
 * 다이소 파인더 검색어·조회 로그용 Apps Script. 설정 순서는 docs/search-logs.md 참고.
 *
 * 하는 일은 세 가지다.
 *  1. doPost  — 앱 서버가 보낸 검색·조회 행을 `searches` 시트에 한 줄씩 쌓는다.
 *  2. refreshPopular — 매시간, 최근 조회를 세어 인기 매장·인기 상품을 `popular`
 *     시트에 적어 둔다. 앱은 doPost(action: "popular")로 이 시트만 읽는다.
 *  3. archiveOldRows — 매일, 보관 기간이 지난 행을 월별 보관 파일로 옮기고
 *     `searches` 에서 지운다. 시트가 끝없이 커지는 걸 막는다.
 *
 * 이 파일은 저장소의 tests/appsScript.test.mjs 가 가짜 SpreadsheetApp 위에서
 * 그대로 실행해 검증한다. 수정하면 Apps Script 편집기에도 통째로 붙여넣는다.
 */

/** 검색어가 쌓일 시트 이름 */
var SHEET_NAME = "searches";

/** 인기 순위 집계 결과가 놓이는 시트 이름 */
var POPULAR_SHEET_NAME = "popular";

/**
 * 아무나 이 웹앱 주소로 쓰레기 값을 넣지 못하게 막는 공유 비밀값.
 * 아래 값을 길고 임의적인 문자열로 바꾼 뒤, 앱의
 * SEARCH_LOG_WEBHOOK_TOKEN 환경변수에 똑같이 넣는다.
 */
var TOKEN = "여기에-임의의-긴-문자열";

/** `searches` 에 남겨 두는 기간(일). 이보다 오래된 행은 보관 파일로 옮긴다. */
var RETAIN_DAYS = 60;

/** 인기 순위를 세는 기간(일) */
var POPULAR_WINDOW_DAYS = 30;

/** 순위 집계 때 시트 끝에서부터 훑는 최대 행 수. 시간 초과를 막는 안전장치다. */
var MAX_SCAN_ROWS = 100000;

/** 한 번의 보관 실행에서 옮기는 최대 행 수. 하루에 이보다 많이 쌓이진 않는다. */
var ARCHIVE_BATCH_ROWS = 20000;

var TOP_BRANCHES = 50;
var TOP_PRODUCTS = 50;
var TOP_PRODUCTS_PER_BRANCH = 10;

var DAY_MS = 24 * 60 * 60 * 1000;
var ARCHIVE_FILE_PREFIX = "다이소 파인더 검색어 로그 ";

var HEADERS = [
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

var POPULAR_HEADERS = [
  "구분",
  "매장 코드",
  "상품 번호",
  "조회 수",
  "순위",
  "집계 시각",
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

  if (payload.action === "popular") {
    return json(Object.assign({ ok: true }, readPopular(payload.branchCode)));
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

/** 시트 셀 값(Date 또는 문자열)을 밀리초로. 읽을 수 없으면 NaN. */
function toTime(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value.getTime();
  }
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).getTime();
  }
  return NaN;
}

function byViewsDesc(a, b) {
  if (b.views !== a.views) {
    return b.views - a.views;
  }
  // 조회 수가 같으면 코드 순으로 정해 두어야 시간이 지나도 순서가 흔들리지 않는다.
  var left = a.branchCode + "|" + (a.productId || "");
  var right = b.branchCode + "|" + (b.productId || "");
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * 조회 행에서 인기 매장·인기 상품을 센다. 시트에 의존하지 않는 순수 함수다.
 *
 * rows 는 시트 한 행씩(HEADERS 순서). 기간 밖의 행, 조회가 아닌 행, 매장 코드나
 * 상품 번호가 빠진 행은 건너뛴다. 상품명은 사용자가 보낸 값이라 집계에 쓰지
 * 않는다 — 화면에 보일 이름은 앱 서버가 상품 번호로 다시 조회한다.
 */
function aggregatePopular(rows, now, windowDays) {
  var cutoff = now - windowDays * DAY_MS;
  var branchViews = {};
  var productViews = {};
  var branchProductViews = {};

  rows.forEach(function (row) {
    var type = row[1];
    if (type !== "branch_view" && type !== "product_view") {
      return;
    }
    var time = toTime(row[0]);
    if (!(time >= cutoff)) {
      return;
    }
    var branchCode = String(row[3] || "");
    if (!branchCode) {
      return;
    }

    if (type === "branch_view") {
      branchViews[branchCode] = (branchViews[branchCode] || 0) + 1;
      return;
    }

    var productId = String(row[7] || "");
    if (!productId) {
      return;
    }
    var key = branchCode + "|" + productId;
    branchProductViews[key] = (branchProductViews[key] || 0) + 1;
    productViews[productId] = (productViews[productId] || 0) + 1;
  });

  var branches = Object.keys(branchViews).map(function (branchCode) {
    return { branchCode: branchCode, views: branchViews[branchCode] };
  });

  var branchProducts = Object.keys(branchProductViews).map(function (key) {
    var parts = key.split("|");
    return {
      branchCode: parts[0],
      productId: parts[1],
      views: branchProductViews[key],
    };
  });

  // 전체 인기 상품은 상품마다 가장 많이 본 매장을 같이 달아, 눌렀을 때 갈 곳을 만든다.
  var topBranchByProduct = {};
  branchProducts.forEach(function (entry) {
    var current = topBranchByProduct[entry.productId];
    if (!current || byViewsDesc(entry, current) < 0) {
      topBranchByProduct[entry.productId] = entry;
    }
  });
  var products = Object.keys(productViews).map(function (productId) {
    return {
      branchCode: topBranchByProduct[productId].branchCode,
      productId: productId,
      views: productViews[productId],
    };
  });

  var perBranch = {};
  var cappedBranchProducts = [];
  branchProducts.sort(byViewsDesc).forEach(function (entry) {
    perBranch[entry.branchCode] = (perBranch[entry.branchCode] || 0) + 1;
    if (perBranch[entry.branchCode] <= TOP_PRODUCTS_PER_BRANCH) {
      cappedBranchProducts.push(entry);
    }
  });

  return {
    generatedAt: new Date(now).toISOString(),
    windowDays: windowDays,
    branches: branches.sort(byViewsDesc).slice(0, TOP_BRANCHES),
    products: products.sort(byViewsDesc).slice(0, TOP_PRODUCTS),
    branchProducts: cappedBranchProducts,
  };
}

/** 집계 결과를 `popular` 시트에 적는다. 구분: branch | product | branch_product */
function writePopular(result) {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(POPULAR_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(POPULAR_SHEET_NAME);
  }

  var values = [POPULAR_HEADERS];
  function push(kind, entries) {
    entries.forEach(function (entry, index) {
      values.push([
        kind,
        entry.branchCode,
        entry.productId || "",
        entry.views,
        index + 1,
        result.generatedAt,
      ]);
    });
  }
  push("branch", result.branches);
  push("product", result.products);
  push("branch_product", result.branchProducts);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheet.clearContents();
    // 매장 코드·상품 번호는 숫자로 바뀌면 앞자리 0 이 사라지므로 글자로 둔다.
    sheet.getRange("B:C").setNumberFormat("@");
    sheet
      .getRange(1, 1, values.length, POPULAR_HEADERS.length)
      .setValues(values);
  } finally {
    lock.releaseLock();
  }
}

/**
 * `popular` 시트를 읽어 앱에 돌려줄 모양으로 만든다. branchCode 를 주면 그 매장의
 * 인기 상품(branchProducts)만 채운다. 집계가 아직 없으면 빈 목록이다.
 */
function readPopular(branchCode) {
  var empty = {
    generatedAt: null,
    windowDays: POPULAR_WINDOW_DAYS,
    branches: [],
    products: [],
    branchProducts: [],
  };

  var sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POPULAR_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return empty;
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var rows;
  try {
    rows = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, POPULAR_HEADERS.length)
      .getValues();
  } finally {
    lock.releaseLock();
  }

  var wanted = branchCode ? String(branchCode) : "";
  rows.forEach(function (row) {
    var entry = {
      branchCode: String(row[1]),
      views: Number(row[3]),
    };
    if (row[2] !== "") {
      entry.productId = String(row[2]);
    }
    empty.generatedAt = String(row[5]);

    if (row[0] === "branch") {
      empty.branches.push(entry);
    } else if (row[0] === "product") {
      empty.products.push(entry);
    } else if (row[0] === "branch_product" && wanted) {
      if (entry.branchCode === wanted) {
        empty.branchProducts.push(entry);
      }
    }
  });
  return empty;
}

/** 시간 트리거(매시간)가 부른다. 최근 조회를 세어 `popular` 시트를 새로 쓴다. */
function refreshPopular() {
  var sheet = getSheet();
  var last = sheet.getLastRow();
  if (last < 2) {
    return null;
  }

  var count = Math.min(last - 1, MAX_SCAN_ROWS);
  var rows = sheet
    .getRange(last - count + 1, 1, count, HEADERS.length)
    .getValues();
  var result = aggregatePopular(rows, Date.now(), POPULAR_WINDOW_DAYS);
  writePopular(result);
  return result;
}

function monthKey(time) {
  return Utilities.formatDate(
    new Date(time),
    Session.getScriptTimeZone(),
    "yyyy-MM",
  );
}

/** 월별 보관 파일의 `searches` 시트. 없으면 새 스프레드시트를 만든다. */
function getArchiveSheet(month) {
  var properties = PropertiesService.getScriptProperties();
  var propertyKey = "archive:" + month;
  var id = properties.getProperty(propertyKey);
  var book = null;

  if (id) {
    try {
      book = SpreadsheetApp.openById(id);
    } catch (error) {
      // 파일이 지워졌거나 접근할 수 없으면 새로 만든다.
      book = null;
    }
  }

  if (!book) {
    book = SpreadsheetApp.create(ARCHIVE_FILE_PREFIX + month);
    properties.setProperty(propertyKey, book.getId());
  }

  var sheet = book.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.setName(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("yyyy-MM-dd HH:mm:ss");
    sheet.getRange("H:H").setNumberFormat("@");
  }
  return sheet;
}

/**
 * 시간 트리거(매일)가 부른다. `searches` 맨 위에서부터 RETAIN_DAYS 보다 오래된
 * 행을 월별 보관 파일에 붙이고 시트에서 지운다. 보관 파일에 쓰는 데 실패하면
 * 아무것도 지우지 않으므로, 행을 잃는 대신 다음 실행에 다시 시도한다.
 *
 * 행은 시간 순으로 쌓이므로 맨 위에서부터 오래된 행이 이어지다 끊기는 곳까지만
 * 옮긴다. 동시 요청 때문에 몇 초 어긋난 행이 경계에 있어도 다음 날 옮겨진다.
 */
function archiveOldRows() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet();
    var last = sheet.getLastRow();
    if (last < 2) {
      return { archived: 0 };
    }

    var cutoff = Date.now() - RETAIN_DAYS * DAY_MS;
    var times = sheet
      .getRange(2, 1, Math.min(last - 1, ARCHIVE_BATCH_ROWS), 1)
      .getValues();
    var count = 0;
    while (count < times.length && toTime(times[count][0]) < cutoff) {
      count++;
    }
    if (count === 0) {
      return { archived: 0 };
    }

    var rows = sheet.getRange(2, 1, count, HEADERS.length).getValues();
    var byMonth = {};
    rows.forEach(function (row) {
      var month = monthKey(toTime(row[0]));
      (byMonth[month] = byMonth[month] || []).push(row);
    });
    Object.keys(byMonth)
      .sort()
      .forEach(function (month) {
        var archive = getArchiveSheet(month);
        archive
          .getRange(
            archive.getLastRow() + 1,
            1,
            byMonth[month].length,
            HEADERS.length,
          )
          .setValues(byMonth[month]);
      });

    // 눈금 전체의 비고정 행을 모두 지우려 하면 시트가 거부하므로 빈 행을 하나 남긴다.
    if (count >= sheet.getMaxRows() - 1) {
      sheet.insertRowsAfter(sheet.getMaxRows(), 1);
    }
    sheet.deleteRows(2, count);
    return { archived: count };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 처음 한 번 편집기에서 직접 실행한다.
 *  - 시트와 머리글을 만들고, 안 쓰는 열(기본 26열 중 9열 밖)을 지워 셀 한도를 아낀다.
 *  - 위 두 시간 트리거를 등록한다. 이미 있으면 다시 만들지 않는다.
 */
function setup() {
  var sheet = getSheet();
  var unused = sheet.getMaxColumns() - HEADERS.length;
  if (unused > 0) {
    sheet.deleteColumns(HEADERS.length + 1, unused);
  }

  var existing = ScriptApp.getProjectTriggers().map(function (trigger) {
    return trigger.getHandlerFunction();
  });
  if (existing.indexOf("refreshPopular") === -1) {
    ScriptApp.newTrigger("refreshPopular").timeBased().everyHours(1).create();
  }
  if (existing.indexOf("archiveOldRows") === -1) {
    ScriptApp.newTrigger("archiveOldRows")
      .timeBased()
      .everyDays(1)
      .atHour(4)
      .create();
  }
}
