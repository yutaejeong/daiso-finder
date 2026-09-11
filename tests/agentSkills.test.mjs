import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

/** 인덱스에 적힌 digest 는 SKILL.md 가 바뀌면 함께 갱신돼야 한다. */
const indexSource = readFileSync(
  new URL("src/app/.well-known/agent-skills/index.json/route.ts", root),
  "utf8",
);

function digestOf(skill) {
  const content = readFileSync(
    new URL(`public/.well-known/agent-skills/${skill}/SKILL.md`, root),
    "utf8",
  ).replace(/\r\n?/g, "\n");
  return createHash("sha256").update(content).digest("hex");
}

test("published skill digests match the files on disk", () => {
  for (const skill of ["search-stores", "search-products"]) {
    assert.ok(
      indexSource.includes(`sha256:${digestOf(skill)}`),
      `stale digest for ${skill}; update index.json/route.ts`,
    );
  }
});

test("each skill file declares the required front matter", () => {
  for (const skill of ["search-stores", "search-products"]) {
    const content = readFileSync(
      new URL(`public/.well-known/agent-skills/${skill}/SKILL.md`, root),
      "utf8",
    );
    assert.match(content, new RegExp(`^---\\r?\\nname: ${skill}\\r?\\n`));
    assert.match(content, /^description: .{40,}$/m);
  }
});
