import assert from "node:assert/strict";
import { test } from "node:test";
import { MCP_TOOLS } from "@/lib/mcpTools";

test("tool names are unique and snake_case", () => {
  const names = MCP_TOOLS.map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.match(name, /^[a-z][a-z0-9_]*$/);
  }
});

test("every tool is described well enough for function calling", () => {
  for (const tool of MCP_TOOLS) {
    assert.ok(tool.title, `${tool.name} has no title`);
    assert.ok(
      tool.description && tool.description.length > 30,
      `${tool.name} has a thin description`,
    );
    assert.equal(tool.inputSchema.type, "object");
    assert.ok(tool.annotations.readOnlyHint, `${tool.name} must be read-only`);
  }
});

test("every declared property is typed and documented", () => {
  for (const tool of MCP_TOOLS) {
    const properties = tool.inputSchema.properties;
    assert.ok(
      Object.keys(properties).length > 0,
      `${tool.name} takes no input`,
    );

    for (const [name, schema] of Object.entries(properties)) {
      assert.ok(schema.type, `${tool.name}.${name} has no type`);
      assert.ok(schema.description, `${tool.name}.${name} has no description`);
    }

    for (const required of tool.inputSchema.required) {
      assert.ok(
        properties[required],
        `${tool.name} requires undeclared "${required}"`,
      );
    }
  }
});

test("covers the store lookup and product lookup workflow", () => {
  const names = MCP_TOOLS.map((tool) => tool.name);
  for (const expected of [
    "search_stores",
    "search_nearby_stores",
    "get_store",
    "search_products",
    "get_product_availability",
  ]) {
    assert.ok(names.includes(expected), `missing tool ${expected}`);
  }
});
