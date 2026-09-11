import assert from "node:assert/strict";
import { test } from "node:test";
import { API_ERROR_CODES } from "@/lib/apiError";
import { buildOpenApiDocument } from "@/lib/openapi";

const BASE = "https://daiso-finder.kr";
const document = buildOpenApiDocument(BASE);

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

function operations() {
  const found = [];
  for (const [path, item] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (HTTP_METHODS.has(method)) {
        found.push({ path, method, operation });
      }
    }
  }
  return found;
}

function collectRefs(value, refs = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectRefs(item, refs);
    return refs;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "$ref" && typeof child === "string") {
        refs.push(child);
      } else {
        collectRefs(child, refs);
      }
    }
  }
  return refs;
}

test("declares OpenAPI 3.1 with servers and external docs", () => {
  assert.equal(document.openapi, "3.1.0");
  assert.equal(document.servers[0].url, BASE);
  assert.equal(document.servers.length, 1);
  assert.equal(document.externalDocs.url, `${BASE}/developers`);
  assert.deepEqual(document.security, []);
});

test("no server prefix duplicates the paths declared by the document", () => {
  for (const server of document.servers) {
    const pathname = new URL(server.url).pathname.replace(/\/$/, "");
    for (const path of Object.keys(document.paths)) {
      assert.equal(
        `${pathname}${path}`.includes("/api/sandbox/api/"),
        false,
        `${server.url} duplicates the API prefix for ${path}`,
      );
    }
  }
});

test("the description tells an agent when to use the API", () => {
  assert.match(document.info.description, /## When to use/);
  assert.match(document.info.description, /## Authentication/);
  assert.match(document.info.description, /No API key/i);
  assert.match(document.info.description, /## Sandbox/);
});

test("every operation has a unique operationId, summary and description", () => {
  const seen = new Set();

  for (const { path, method, operation } of operations()) {
    const where = `${method.toUpperCase()} ${path}`;
    assert.ok(operation.operationId, `${where} has no operationId`);
    assert.equal(
      seen.has(operation.operationId),
      false,
      `duplicate operationId ${operation.operationId}`,
    );
    seen.add(operation.operationId);

    assert.ok(operation.summary, `${where} has no summary`);
    assert.ok(
      operation.description && operation.description.length > 40,
      `${where} has no meaningful description`,
    );
    assert.ok(operation.tags?.length, `${where} has no tags`);
    assert.ok(operation.responses?.["200"], `${where} has no 200 response`);
  }
});

test("every parameter is typed and documented", () => {
  for (const { path, method, operation } of operations()) {
    for (const parameter of operation.parameters ?? []) {
      const where = `${method.toUpperCase()} ${path} ${parameter.name}`;
      assert.ok(parameter.description, `${where} has no description`);
      assert.ok(parameter.schema?.type, `${where} has no schema type`);
      assert.ok(["query", "path"].includes(parameter.in), `${where} bad in`);
      if (parameter.in === "path") {
        assert.equal(parameter.required, true, `${where} must be required`);
      }
    }
  }
});

test("path parameters match the templated path segments", () => {
  for (const { path, operation } of operations()) {
    const templated = [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
    const declared = (operation.parameters ?? [])
      .filter((parameter) => parameter.in === "path")
      .map((parameter) => parameter.name);
    assert.deepEqual(declared.sort(), templated.sort(), `mismatch on ${path}`);
  }
});

test("every $ref resolves inside the document", () => {
  for (const ref of collectRefs(document)) {
    assert.match(ref, /^#\//, `external ref: ${ref}`);
    const resolved = ref
      .slice(2)
      .split("/")
      .reduce((node, key) => node?.[key], document);
    assert.ok(resolved, `unresolved ref: ${ref}`);
  }
});

test("error responses all describe the shared Error schema", () => {
  for (const response of Object.values(document.components.responses)) {
    assert.equal(
      response.content["application/json"].schema.$ref,
      "#/components/schemas/Error",
    );
  }

  const errorSchema = document.components.schemas.Error;
  assert.deepEqual(errorSchema.properties.code.enum, [...API_ERROR_CODES]);
  for (const field of ["error", "code", "message", "hint", "status"]) {
    assert.ok(errorSchema.required.includes(field));
  }
});

test("documents the endpoints the site actually serves", () => {
  const expected = [
    "/api",
    "/api/branches/search",
    "/api/branches/{code}",
    "/api/products",
    "/api/products/{id}",
    "/api/sandbox/branches/search",
    "/api/sandbox/branches/{code}",
    "/api/sandbox/products",
    "/api/sandbox/products/{id}",
    "/api/mcp",
  ];

  assert.deepEqual(Object.keys(document.paths).sort(), expected.sort());
});

test("every response schema property is described", () => {
  for (const [name, schema] of Object.entries(document.components.schemas)) {
    if (!schema.properties) continue;
    for (const [property, definition] of Object.entries(schema.properties)) {
      if (definition.$ref || definition.const) continue;
      assert.ok(
        definition.type || definition.oneOf || definition.additionalProperties,
        `${name}.${property} has no type`,
      );
    }
  }
});
