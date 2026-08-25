import assert from "node:assert/strict";
import { test } from "node:test";
import { API_ERROR_CODES } from "@/lib/apiError";
import { MCP_TOOLS } from "@/lib/mcpTools";

/**
 * 실제로 구동 중인 서버를 대상으로 하는 엔드투엔드 확인.
 * `pnpm build && pnpm start` 후 DAISO_E2E_BASE_URL 을 주고 실행한다.
 * 값이 없으면 단위 테스트만 돌도록 전체를 건너뛴다.
 */
const BASE = process.env.DAISO_E2E_BASE_URL?.replace(/\/$/, "");
const options = { skip: BASE ? false : "set DAISO_E2E_BASE_URL to run" };

function url(path) {
  return `${BASE}${path}`;
}

async function getJson(path, init) {
  const response = await fetch(url(path), init);
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

test(
  "home page ships readable content without JavaScript",
  options,
  async () => {
    const response = await fetch(url("/"));
    assert.equal(response.status, 200);

    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    assert.match(html, /<h1[^>]*>/);
    assert.ok(text.length > 500, `only ${text.length} chars of text`);
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /"@type":"Organization"/);
    assert.match(html, /href="\/developers"/);
  },
);

test("trust anchor pages carry real content", options, async () => {
  for (const path of ["/about", "/contact", "/privacy", "/developers"]) {
    const response = await fetch(url(path));
    assert.equal(response.status, 200, `${path} returned ${response.status}`);

    const text = (await response.text())
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    assert.ok(text.length > 500, `${path} only has ${text.length} chars`);
  }
});

test("markdown negotiation varies on Accept", options, async () => {
  const response = await fetch(url("/"), {
    headers: { Accept: "text/markdown" },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/markdown/);
  assert.match(response.headers.get("vary"), /accept/i);
  assert.match(await response.text(), /## 언제 쓰나요/);
});

test("OpenAPI spec is served as JSON and YAML", options, async () => {
  for (const path of ["/openapi.json", "/api/openapi.json"]) {
    const { response, body } = await getJson(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.equal(body.openapi, "3.1.0");
    assert.ok(body.paths["/api/branches/search"].get.operationId);
  }

  for (const path of ["/openapi.yaml", "/api/openapi.yaml"]) {
    const response = await fetch(url(path));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /yaml/);
    assert.match(await response.text(), /^openapi: 3\.1\.0$/m);
  }
});

test(
  "unknown API routes answer with structured JSON, not HTML",
  options,
  async () => {
    const { response, body } = await getJson("/api/does-not-exist");

    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.equal(body.code, "route_not_found");
    assert.ok(API_ERROR_CODES.includes(body.code));
    assert.ok(body.hint);
    assert.ok(body.documentation);
  },
);

test("parameter validation errors are structured JSON", options, async () => {
  const { response, body } = await getJson("/api/branches/search");

  assert.equal(response.status, 400);
  assert.equal(body.code, "missing_parameter");
  assert.match(body.message, /keyword/);
  assert.ok(body.hint);
});

test(
  "the API index lists every operation and discovery document",
  options,
  async () => {
    const { response, body } = await getJson("/api");

    assert.equal(response.status, 200);
    assert.equal(body.authentication.required, false);
    assert.ok(body.endpoints.length >= 6);
    for (const endpoint of body.endpoints) {
      assert.ok(endpoint.operationId);
      assert.ok(endpoint.description);
    }
    for (const key of [
      "openapiJson",
      "developerPortal",
      "mcpManifest",
      "sandbox",
    ]) {
      assert.ok(body.documentation[key], `missing ${key}`);
    }
  },
);

test("sandbox answers from fixtures without an API key", options, async () => {
  const stores = await getJson("/api/sandbox/branches/search?keyword=강남");
  assert.equal(stores.response.status, 200);
  assert.equal(stores.body[0].code, "11199");

  const store = await getJson("/api/sandbox/branches/11199");
  assert.equal(store.body.name, "강남역점");

  const missing = await getJson("/api/sandbox/branches/00000");
  assert.equal(missing.response.status, 404);
  assert.equal(missing.body.code, "not_found");

  const products = await getJson(
    "/api/sandbox/products?branchCode=11199&keyword=수세미",
  );
  assert.equal(products.response.status, 200);
  assert.ok(products.body.products.length > 0);

  const invalid = await getJson("/api/sandbox/products?keyword=수세미");
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.code, "missing_parameter");
});

test("MCP endpoint speaks Streamable HTTP JSON-RPC", options, async () => {
  const init = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    }),
  });

  assert.equal(init.status, 200);
  assert.ok(init.headers.get("mcp-session-id"), "no session id issued");
  const initBody = JSON.parse(await init.text());
  assert.equal(initBody.result.protocolVersion, "2025-06-18");

  const list = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
  });
  const listBody = JSON.parse(await list.text());
  assert.deepEqual(
    listBody.result.tools.map((tool) => tool.name).sort(),
    MCP_TOOLS.map((tool) => tool.name).sort(),
  );

  const notification = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
  });
  assert.equal(notification.status, 202);

  const sse = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "ping" }),
  });
  assert.match(sse.headers.get("content-type"), /text\/event-stream/);
  const sseBody = await sse.text();
  assert.match(sseBody, /^event: message$/m);
  assert.equal(JSON.parse(sseBody.split("data: ")[1]).id, 3);

  const malformed = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json",
  });
  assert.equal(malformed.status, 400);
  assert.equal(JSON.parse(await malformed.text()).error.code, -32700);
});

test("discovery documents are reachable", options, async () => {
  const jsonDocuments = [
    "/.well-known/mcp.json",
    "/.well-known/mcp/server-card.json",
    "/.well-known/api-catalog",
    "/.well-known/agent-skills/index.json",
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-authorization-server",
  ];

  for (const path of jsonDocuments) {
    const { response, body } = await getJson(path);
    assert.equal(response.status, 200, `${path} returned ${response.status}`);
    assert.ok(body, `${path} returned an empty body`);
  }

  const manifest = (await getJson("/.well-known/mcp.json")).body;
  assert.equal(manifest.remotes[0].type, "streamable-http");
  assert.match(manifest.remotes[0].url, /\/api\/mcp$/);

  const textDocuments = [
    ["/llms.txt", /## When to use this/],
    ["/agent-instructions.md", /## When to use this/],
    ["/auth.md", /익명/],
    ["/robots.txt", /Sitemap:/],
    ["/sitemap.xml", /<loc>/],
    ["/.well-known/agent-skills/search-stores/SKILL.md", /Search Daiso Stores/],
  ];

  for (const [path, pattern] of textDocuments) {
    const response = await fetch(url(path));
    assert.equal(response.status, 200, `${path} returned ${response.status}`);
    assert.match(await response.text(), pattern, `${path} content mismatch`);
  }
});

test(
  "robots.txt keeps the discovery documents crawlable",
  options,
  async () => {
    const robots = await (await fetch(url("/robots.txt"))).text();

    assert.match(robots, /^Allow: \/api\/openapi\.json$/m);
    assert.match(robots, /^Allow: \/api\/sandbox$/m);
    assert.match(robots, /^Disallow: \/api\/$/m);
    assert.match(robots, /^Sitemap: https?:\/\/.+\/sitemap\.xml$/m);
  },
);

test(
  "the sitemap advertises the new trust and developer pages",
  options,
  async () => {
    const xml = await (await fetch(url("/sitemap.xml"))).text();

    for (const path of ["/developers", "/about", "/contact", "/privacy"]) {
      assert.ok(xml.includes(path), `sitemap is missing ${path}`);
    }
  },
);
