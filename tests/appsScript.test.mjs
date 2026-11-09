import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const SOURCE = readFileSync(
  new URL("../docs/apps-script/Code.gs", import.meta.url),
  "utf8",
);

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 7, 12, 0, 0);

/** 2차원 배열 하나로 시트 흉내를 낸다. 스크립트가 쓰는 메서드만 구현했다. */
class FakeSheet {
  constructor(name, maxRows = 1000, maxColumns = 26) {
    this.name = name;
    this.rows = [];
    this.maxRows = maxRows;
    this.maxColumns = maxColumns;
    this.frozen = 0;
  }
  getName() {
    return this.name;
  }
  setName(name) {
    this.name = name;
  }
  getLastRow() {
    return this.rows.length;
  }
  getLastColumn() {
    return this.rows.reduce((max, row) => Math.max(max, row.length), 0);
  }
  getMaxRows() {
    return Math.max(this.maxRows, this.rows.length);
  }
  getMaxColumns() {
    return this.maxColumns;
  }
  setFrozenRows(count) {
    this.frozen = count;
  }
  appendRow(row) {
    this.rows.push([...row]);
  }
  clearContents() {
    this.rows = [];
  }
  deleteColumns(from, count) {
    this.maxColumns -= count;
    this.deletedColumns = { from, count };
  }
  insertRowsAfter(after, count) {
    this.maxRows += count;
  }
  deleteRows(from, count) {
    if (from - 1 + count >= this.getMaxRows()) {
      throw new Error("You can't delete all the non-frozen rows on a sheet.");
    }
    this.rows.splice(from - 1, count);
    this.maxRows -= count;
  }
  getRange(a, b, c, d) {
    if (typeof a === "string") {
      return { setNumberFormat() {} };
    }
    const sheet = this;
    return {
      getValues() {
        const out = [];
        for (let i = 0; i < c; i++) {
          const row = sheet.rows[a - 1 + i] ?? [];
          out.push(Array.from({ length: d }, (_, j) => row[b - 1 + j] ?? ""));
        }
        return out;
      },
      setValues(values) {
        values.forEach((values, i) => {
          const index = a - 1 + i;
          sheet.rows[index] = sheet.rows[index] ?? [];
          values.forEach((value, j) => {
            sheet.rows[index][b - 1 + j] = value;
          });
        });
        sheet.maxRows = Math.max(sheet.maxRows, sheet.rows.length);
      },
    };
  }
}

class FakeBook {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.sheets = [new FakeSheet("시트1")];
  }
  getId() {
    return this.id;
  }
  getSheets() {
    return this.sheets;
  }
  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.name === name) ?? null;
  }
  insertSheet(name) {
    const sheet = new FakeSheet(name);
    this.sheets.push(sheet);
    return sheet;
  }
}

/** Apps Script 전역을 흉내 낸 샌드박스 안에서 Code.gs 를 실행한다. */
function loadScript({ now = NOW } = {}) {
  const active = new FakeBook("active", "active");
  const created = [];
  const properties = new Map();
  const triggers = [];
  let lockHeld = 0;

  const FakeDate = class extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
  };

  const context = {
    Date: FakeDate,
    Object,
    JSON,
    Math,
    Number,
    String,
    Array,
    isNaN,
    LockService: {
      getScriptLock: () => ({
        waitLock() {
          lockHeld++;
        },
        releaseLock() {
          lockHeld--;
        },
      }),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({
        text,
        setMimeType() {
          return this;
        },
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => active,
      create: (name) => {
        const book = new FakeBook(`archive-${created.length}`, name);
        created.push(book);
        return book;
      },
      openById: (id) => {
        const book = created.find((candidate) => candidate.id === id);
        if (!book) throw new Error("not found");
        return book;
      },
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => properties.get(key) ?? null,
        setProperty: (key, value) => properties.set(key, value),
      }),
    },
    Utilities: {
      // 테스트에서는 UTC 로 고정한다.
      formatDate: (date) => date.toISOString().slice(0, 7),
    },
    Session: { getScriptTimeZone: () => "UTC" },
    ScriptApp: {
      getProjectTriggers: () =>
        triggers.map((handler) => ({ getHandlerFunction: () => handler })),
      newTrigger: (handler) => {
        const builder = {
          timeBased: () => builder,
          everyHours: () => builder,
          everyDays: () => builder,
          atHour: () => builder,
          create: () => triggers.push(handler),
        };
        return builder;
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context);

  return {
    context,
    active,
    created,
    properties,
    triggers,
    heldLocks: () => lockHeld,
    post(payload) {
      const output = context.doPost({
        postData: { contents: JSON.stringify(payload) },
      });
      return JSON.parse(output.text);
    },
  };
}

const HEADERS_ROW = [
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

function row(daysAgo, type, fields = {}) {
  return [
    new Date(NOW - daysAgo * DAY),
    type,
    fields.keyword ?? "",
    fields.branchCode ?? "",
    "",
    "web",
    "ok",
    fields.productId ?? "",
    fields.productName ?? "",
  ];
}

test("doPost appends rows and rejects a wrong token", () => {
  const script = loadScript();
  script.context.TOKEN = "secret";

  assert.deepEqual(script.post({ token: "nope", rows: [{}] }), {
    ok: false,
    error: "forbidden",
  });

  const result = script.post({
    token: "secret",
    rows: [
      {
        timestamp: "2026-11-07T01:02:03.000Z",
        type: "product_view",
        branchCode: "11199",
        productId: "1019373",
        productName: "물티슈",
        source: "web",
        status: "ok",
      },
    ],
  });
  assert.deepEqual(result, { ok: true, appended: 1 });

  const sheet = script.active.getSheetByName("searches");
  assert.deepEqual(sheet.rows[0], HEADERS_ROW);
  assert.equal(sheet.rows[1][1], "product_view");
  assert.equal(sheet.rows[1][7], "1019373");
  assert.equal(script.heldLocks(), 0);
});

test("aggregatePopular counts only recent views and ranks them", () => {
  const { context } = loadScript();
  const rows = [
    row(1, "branch_view", { branchCode: "11199" }),
    row(2, "branch_view", { branchCode: "11199" }),
    row(2, "branch_view", { branchCode: "10528" }),
    row(40, "branch_view", { branchCode: "10528" }), // 집계 기간 밖
    row(1, "product_view", { branchCode: "11199", productId: "A" }),
    row(1, "product_view", { branchCode: "11199", productId: "A" }),
    row(1, "product_view", { branchCode: "10528", productId: "A" }),
    row(1, "product_view", { branchCode: "10528", productId: "B" }),
    row(1, "product", { keyword: "물티슈", branchCode: "11199" }), // 검색은 제외
    row(1, "product_view", { branchCode: "", productId: "C" }), // 매장 코드 없음
    row(1, "product_view", { branchCode: "11199", productId: "" }), // 상품 번호 없음
  ];

  const result = context.aggregatePopular(rows, NOW, 30);

  assert.deepEqual(JSON.parse(JSON.stringify(result.branches)), [
    { branchCode: "11199", views: 2 },
    { branchCode: "10528", views: 1 },
  ]);
  // 상품 A 는 전체 3회이고, 가장 많이 본 매장은 11199 다.
  assert.deepEqual(JSON.parse(JSON.stringify(result.products)), [
    { branchCode: "11199", productId: "A", views: 3 },
    { branchCode: "10528", productId: "B", views: 1 },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.branchProducts)), [
    { branchCode: "11199", productId: "A", views: 2 },
    { branchCode: "10528", productId: "A", views: 1 },
    { branchCode: "10528", productId: "B", views: 1 },
  ]);
  assert.equal(result.generatedAt, new Date(NOW).toISOString());
});

test("aggregatePopular keeps only the top products per store", () => {
  const { context } = loadScript();
  const rows = [];
  for (let id = 1; id <= 15; id++) {
    // 상품 번호가 클수록 많이 본 것으로 만든다.
    for (let i = 0; i < id; i++) {
      rows.push(
        row(1, "product_view", { branchCode: "11199", productId: String(id) }),
      );
    }
  }

  const result = context.aggregatePopular(rows, NOW, 30);

  assert.equal(result.branchProducts.length, 10);
  assert.equal(result.branchProducts[0].productId, "15");
  assert.equal(result.branchProducts[9].productId, "6");
});

test("popular numbers round-trip through the popular sheet", () => {
  const script = loadScript();
  script.context.TOKEN = "secret";
  const sheet = script.context.getSheet();
  sheet
    .getRange(2, 1, 4, 9)
    .setValues([
      row(1, "branch_view", { branchCode: "11199" }),
      row(1, "branch_view", { branchCode: "11199" }),
      row(1, "product_view", { branchCode: "11199", productId: "A" }),
      row(1, "product_view", { branchCode: "10528", productId: "B" }),
    ]);

  const empty = script.post({ token: "secret", action: "popular" });
  assert.equal(empty.generatedAt, null);
  assert.deepEqual(empty.branches, []);

  script.context.refreshPopular();
  const all = script.post({ token: "secret", action: "popular" });
  assert.equal(all.ok, true);
  assert.deepEqual(all.branches, [{ branchCode: "11199", views: 2 }]);
  assert.equal(all.products.length, 2);
  // 매장을 지정하지 않으면 매장별 인기 상품은 비어 있다.
  assert.deepEqual(all.branchProducts, []);

  const store = script.post({
    token: "secret",
    action: "popular",
    branchCode: "10528",
  });
  assert.deepEqual(store.branchProducts, [
    { branchCode: "10528", productId: "B", views: 1 },
  ]);
  assert.equal(script.heldLocks(), 0);
});

test("archiveOldRows moves old rows to monthly files and keeps recent ones", () => {
  const script = loadScript();
  const sheet = script.context.getSheet();
  const rows = [
    row(120, "branch", { keyword: "강남" }),
    row(100, "product_view", { branchCode: "11199", productId: "A" }),
    row(95, "branch_view", { branchCode: "11199" }),
    row(10, "branch_view", { branchCode: "10528" }),
    row(1, "branch", { keyword: "명동" }),
  ];
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);

  const result = script.context.archiveOldRows();

  assert.equal(result.archived, 3);
  // 남은 건 머리글 + 최근 두 줄
  assert.equal(sheet.rows.length, 3);
  assert.equal(sheet.rows[1][3], "10528");

  // 120일 전 · 100일 전 · 95일 전은 월이 갈리므로 보관 파일이 둘 이상이다.
  const archivedRows = script.created.flatMap((book) =>
    book.getSheets()[0].rows.slice(1),
  );
  assert.equal(archivedRows.length, 3);
  assert.deepEqual(
    script.created.map((book) => book.getSheets()[0].getName()),
    script.created.map(() => "searches"),
  );
  for (const book of script.created) {
    assert.match(book.name, /^다이소 파인더 검색어 로그 \d{4}-\d{2}$/);
  }

  // 두 번째 실행에서는 더 옮길 게 없고, 보관 파일을 새로 만들지도 않는다.
  const filesBefore = script.created.length;
  assert.equal(script.context.archiveOldRows().archived, 0);
  assert.equal(script.created.length, filesBefore);
  assert.equal(script.heldLocks(), 0);
});

test("archiveOldRows appends to the same monthly file on later runs", () => {
  const script = loadScript();
  const sheet = script.context.getSheet();
  sheet.getRange(2, 1, 1, 9).setValues([row(100, "branch", { keyword: "a" })]);
  script.context.archiveOldRows();
  sheet.getRange(2, 1, 1, 9).setValues([row(100, "branch", { keyword: "b" })]);
  script.context.archiveOldRows();

  assert.equal(script.created.length, 1);
  assert.deepEqual(
    script.created[0]
      .getSheets()[0]
      .rows.slice(1)
      .map((r) => r[2]),
    ["a", "b"],
  );
});

test("archiveOldRows survives archiving every row in a tight grid", () => {
  const script = loadScript();
  const sheet = script.context.getSheet();
  sheet
    .getRange(2, 1, 2, 9)
    .setValues([
      row(200, "branch", { keyword: "a" }),
      row(199, "branch", { keyword: "b" }),
    ]);
  // 눈금이 데이터 행 수와 같은 경우: 비고정 행을 전부 지우면 시트가 거부한다.
  sheet.maxRows = sheet.rows.length;

  assert.equal(script.context.archiveOldRows().archived, 2);
  assert.equal(sheet.rows.length, 1);
});

test("archiveOldRows deletes nothing when the archive write fails", () => {
  const script = loadScript();
  const sheet = script.context.getSheet();
  sheet.getRange(2, 1, 1, 9).setValues([row(100, "branch", { keyword: "a" })]);
  script.context.SpreadsheetApp.create = () => {
    throw new Error("quota exceeded");
  };

  assert.throws(() => script.context.archiveOldRows(), /quota exceeded/);
  assert.equal(sheet.rows.length, 2);
  assert.equal(script.heldLocks(), 0);
});

test("setup trims unused columns and installs each trigger once", () => {
  const script = loadScript();

  script.context.setup();
  script.context.setup();

  const sheet = script.active.getSheetByName("searches");
  assert.equal(sheet.getMaxColumns(), 9);
  assert.deepEqual(script.triggers.sort(), [
    "archiveOldRows",
    "refreshPopular",
  ]);
});
