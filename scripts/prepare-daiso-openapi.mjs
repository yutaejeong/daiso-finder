import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL =
  process.env.DAISO_OPENAPI_URL ?? "https://fapi.daisomall.co.kr/v3/api-docs";
const OUTPUT_PATH = path.resolve("openapi/daiso.filtered.json");

const SELECTED_PATHS = [
  "/ms/msg/selStr",
  "/pdo/pdThumbSel",
  "/pdo/pdThumbSelSimple",
  "/pdo/selOfflStrStck",
  "/pdo/selPdStDispInfo",
];

function getByJsonPointer(root, pointer) {
  return pointer
    .replace(/^#\//, "")
    .split("/")
    .reduce((current, segment) => current?.[segment], root);
}

function setByJsonPointer(root, pointer, value) {
  const segments = pointer.replace(/^#\//, "").split("/");
  let current = root;

  for (const segment of segments.slice(0, -1)) {
    current[segment] ??= {};
    current = current[segment];
  }

  current[segments.at(-1)] = value;
}

function collectRefs(value, refs = new Set()) {
  if (!value || typeof value !== "object") {
    return refs;
  }

  if (typeof value.$ref === "string" && value.$ref.startsWith("#/")) {
    refs.add(value.$ref);
  }

  for (const child of Object.values(value)) {
    collectRefs(child, refs);
  }

  return refs;
}

function normalizeJsonResponseContent(value) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (value.content?.["*/*"] && !value.content["application/json"]) {
    value.content["application/json"] = value.content["*/*"];
    delete value.content["*/*"];
  }

  for (const child of Object.values(value)) {
    normalizeJsonResponseContent(child);
  }
}

function buildFilteredSpec(spec) {
  const paths = {};

  for (const selectedPath of SELECTED_PATHS) {
    if (!spec.paths?.[selectedPath]) {
      throw new Error(`OpenAPI path not found: ${selectedPath}`);
    }

    paths[selectedPath] = structuredClone(spec.paths[selectedPath]);
  }

  normalizeJsonResponseContent(paths);

  const output = {
    openapi: spec.openapi,
    info: spec.info,
    servers: spec.servers,
    paths,
    components: {},
  };

  const pendingRefs = [...collectRefs(paths)];
  const copiedRefs = new Set();

  while (pendingRefs.length > 0) {
    const ref = pendingRefs.pop();

    if (!ref || copiedRefs.has(ref)) {
      continue;
    }

    const value = getByJsonPointer(spec, ref);

    if (!value) {
      throw new Error(`OpenAPI ref not found: ${ref}`);
    }

    const clonedValue = structuredClone(value);
    normalizeJsonResponseContent(clonedValue);
    setByJsonPointer(output, ref, clonedValue);
    copiedRefs.add(ref);

    for (const nestedRef of collectRefs(clonedValue)) {
      if (!copiedRefs.has(nestedRef)) {
        pendingRefs.push(nestedRef);
      }
    }
  }

  return output;
}

const response = await fetch(SOURCE_URL);

if (!response.ok) {
  throw new Error(
    `Failed to download Daiso OpenAPI spec: ${response.status} ${response.statusText}`,
  );
}

const spec = await response.json();
const filteredSpec = buildFilteredSpec(spec);

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(filteredSpec, null, 2)}\n`);

console.log(
  `Prepared ${SELECTED_PATHS.length} Daiso API paths from ${SOURCE_URL}`,
);
