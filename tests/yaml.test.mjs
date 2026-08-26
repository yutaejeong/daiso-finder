import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOpenApiDocument } from "@/lib/openapi";
import { toYaml } from "@/lib/yaml";

test("emits scalars, nested maps and sequences", () => {
  const yaml = toYaml({
    openapi: "3.1.0",
    info: { title: "Daiso Finder API", version: "1.0.0" },
    tags: ["stores", "products"],
  });

  assert.equal(
    yaml,
    [
      "openapi: 3.1.0",
      "info:",
      "  title: Daiso Finder API",
      "  version: 1.0.0",
      "tags:",
      "- stores",
      "- products",
      "",
    ].join("\n"),
  );
});

test("quotes values that would otherwise change type", () => {
  const yaml = toYaml({
    yes: "no",
    empty: "",
    numeric: "010",
    real: 10,
    flag: true,
    nothing: null,
    colon: "a: b",
  });

  assert.match(yaml, /^"yes": "no"$/m);
  assert.match(yaml, /^empty: ""$/m);
  assert.match(yaml, /^numeric: "010"$/m);
  assert.match(yaml, /^real: 10$/m);
  assert.match(yaml, /^flag: true$/m);
  assert.match(yaml, /^nothing: null$/m);
  assert.match(yaml, /^colon: "a: b"$/m);
});

test("renders objects inside sequences with hanging indentation", () => {
  const yaml = toYaml({
    servers: [
      { url: "https://daiso-finder.kr", description: "Production" },
      { url: "https://daiso-finder.kr/api/sandbox", description: "Sandbox" },
    ],
  });

  assert.equal(
    yaml,
    [
      "servers:",
      '- url: "https://daiso-finder.kr"',
      "  description: Production",
      '- url: "https://daiso-finder.kr/api/sandbox"',
      "  description: Sandbox",
      "",
    ].join("\n"),
  );
});

test("keeps empty collections inline", () => {
  assert.equal(
    toYaml({ security: [], schemes: {} }),
    "security: []\nschemes: {}\n",
  );
});

test("serialises the whole OpenAPI document without dropping keys", () => {
  const document = buildOpenApiDocument("https://daiso-finder.kr");
  const yaml = toYaml(document);

  assert.match(yaml, /^openapi: 3\.1\.0$/m);
  assert.match(yaml, /^ {2}"\/api\/branches\/search":$/m);
  assert.match(yaml, /operationId: searchStores/);
  assert.match(yaml, /"\$ref": "#\/components\/schemas\/Error"/);
  // 여러 줄 설명은 줄바꿈이 이스케이프된 채로 한 줄에 담긴다.
  assert.match(yaml, /description: ".*## When to use/);
  // 특수문자가 든 키와 값은 따옴표로 감싸 YAML 파서가 다르게 읽지 않게 한다.
  assert.match(yaml, /^ {2}"\/api\/mcp":$/m);
});
