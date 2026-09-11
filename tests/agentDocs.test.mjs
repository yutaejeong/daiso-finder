import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildMarkdownForPath } from "@/lib/appMarkdown";
import { MCP_TOOLS } from "@/lib/mcpTools";

const root = new URL("../", import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), "utf8");

const llmsTxt = read("public/llms.txt");
const agentInstructions = read("public/agent-instructions.md");
const authMd = read("public/auth.md");

test("llms.txt tells agents when to use and when not to use the service", () => {
  assert.match(llmsTxt, /## When to use this/);
  assert.match(llmsTxt, /쓰면 안 되는 상황/);
  assert.match(llmsTxt, /인증은 필요 없다/);
  assert.match(llmsTxt, /agent-instructions\.md/);
  assert.match(llmsTxt, /openapi\.json/);
  assert.match(llmsTxt, /\/developers/);
});

test("agent instructions name concrete jobs and the calling order", () => {
  assert.match(agentInstructions, /## When to use this/);
  assert.match(agentInstructions, /## When not to use this/);
  assert.match(agentInstructions, /## How to call it/);
  assert.match(agentInstructions, /## Errors/);
  assert.match(agentInstructions, /\/api\/branches\/search\?keyword=/);
  assert.match(agentInstructions, /\/api\/products\?branchCode=/);
  assert.ok(
    agentInstructions.length > 1500,
    "instructions should be substantial",
  );
});

test("agent instructions list every MCP tool the server exposes", () => {
  for (const tool of MCP_TOOLS) {
    assert.match(
      agentInstructions,
      new RegExp(`\`${tool.name}\``),
      `${tool.name} is not documented`,
    );
  }
});

test("auth.md states the keyless self-serve onboarding path", () => {
  assert.match(authMd, /익명/);
  assert.match(authMd, /API 키 발급 \| 불필요/);
  assert.match(authMd, /샌드박스/);
  assert.match(authMd, /\/api\/sandbox/);
});

test("markdown representation carries when-to-use guidance and error shape", () => {
  const home = buildMarkdownForPath("/");
  assert.match(home, /## 언제 쓰나요/);
  assert.match(home, /## 오류 형식/);
  assert.match(home, /openapi\.json/);
  assert.ok(home.length > 1500);
  assert.match(home, /현재 페이지: 홈/);
});

test("markdown representation is page-aware", () => {
  const developers = buildMarkdownForPath("/developers");
  assert.match(developers, /개발자 포털 \(\/developers\)/);
  assert.match(developers, /## 1분 퀵스타트/);
  assert.match(developers, /sandbox\/products\/1019373/);

  const about = buildMarkdownForPath("/about");
  assert.match(about, /서비스 소개 \(\/about\)/);
  assert.match(about, /## 데이터 정확도/);

  const privacy = buildMarkdownForPath("/privacy");
  assert.match(privacy, /개인정보 처리방침 \(\/privacy\)/);
  assert.match(privacy, /## 위치 정보/);
  assert.match(privacy, /Google Analytics/);

  const contact = buildMarkdownForPath("/contact");
  assert.match(contact, /문의 \(\/contact\)/);
  assert.match(contact, /contact@daiso-finder\.kr/);
  assert.match(
    buildMarkdownForPath("/branch/11199"),
    /매장 상세 \(\/branch\/11199\)/,
  );
  assert.match(buildMarkdownForPath("/unknown"), /현재 페이지: \/unknown/);
});

test("markdown documentation points at the canonical host", () => {
  // apex 는 www 로 307 리다이렉트되므로 문서에 남은 apex 주소는 에이전트에게
  // 불필요한 왕복을 시킨다.
  for (const path of ["/", "/developers", "/privacy"]) {
    const markdown = buildMarkdownForPath(path);
    assert.doesNotMatch(
      markdown,
      /https:\/\/daiso-finder\.kr/,
      `${path} still links the redirecting apex host`,
    );
  }

  const developers = buildMarkdownForPath("/developers");
  assert.match(developers, /https:\/\/www\.daiso-finder\.kr\/api\/products/);
});
