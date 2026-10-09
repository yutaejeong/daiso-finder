import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

// 브라우저 번역은 맨 텍스트 노드를 번역문 노드로 바꿔 끼운다. React 가 그런
// 텍스트 노드를 조건부로 지우면 removeChild 가 NotFoundError 를 던지고 화면
// 전체가 오류 페이지로 넘어간다(Sentry DAISO-FINDER-N). 조건부 문구는
// `{cond && <span>문구</span>}` 처럼 요소로 감싸야 한다.

const SRC = new URL("../src/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

function tsxFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

// `{cond && "문구"}` 와 줄바꿈된 `{cond &&\n  "문구"}` 를 잡는다.
const BARE_CONDITIONAL_TEXT = /&&\s*["'`]/g;

test("conditional JSX text is wrapped in an element", () => {
  const offenders = [];

  for (const file of tsxFiles(SRC)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(BARE_CONDITIONAL_TEXT)) {
      const line = source.slice(0, match.index).split("\n").length;
      // JSX 자식 위치(`{` 바로 안)일 때만 문제다. props 안의 문자열 조건식은 둔다.
      const lineStart = source.lastIndexOf("\n", match.index) + 1;
      if (!source.slice(lineStart, match.index).trimStart().startsWith("{")) {
        continue;
      }
      offenders.push(`${relative(SRC, file)}:${line}`);
    }
  }

  assert.deepEqual(offenders, []);
});
