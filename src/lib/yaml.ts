/**
 * JSON 으로 표현 가능한 값만 다루는 최소 YAML 직렬화기.
 * OpenAPI 문서를 `/openapi.yaml` 로 내보내기 위해서만 쓰이므로
 * 앵커·태그·복합 키 같은 YAML 고급 문법은 지원하지 않는다.
 */
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const PLAIN_SCALAR = /^[A-Za-z0-9_][A-Za-z0-9_ /.\-+()]*$/;

/** 따옴표 없이 두면 다른 타입으로 읽히는 문자열들 */
const RESERVED = new Set([
  "true",
  "false",
  "null",
  "yes",
  "no",
  "on",
  "off",
  "y",
  "n",
  "~",
]);

function needsQuotes(value: string): boolean {
  if (value === "") return true;
  if (RESERVED.has(value.toLowerCase())) return true;
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(value)) return true;
  if (/\s{2,}|^\s|\s$/.test(value)) return true;
  return !PLAIN_SCALAR.test(value);
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function scalar(value: string | number | boolean | null): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : quote(String(value));
  }
  if (typeof value === "boolean") return String(value);
  if (value.includes("\n")) {
    // 여러 줄 문자열은 리터럴 블록으로 두어야 줄바꿈이 보존된다.
    return quote(value);
  }
  return needsQuotes(value) ? quote(value) : value;
}

function isScalar(value: JsonValue): value is string | number | boolean | null {
  return value === null || typeof value !== "object";
}

function stringify(value: JsonValue, indent: number): string {
  const pad = "  ".repeat(indent);

  if (isScalar(value)) {
    return `${pad}${scalar(value)}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (isScalar(item)) return `${pad}- ${scalar(item)}`;
        const nested = stringify(item, indent + 1);
        return `${pad}- ${nested.slice(pad.length + 2)}`;
      })
      .join("\n");
  }

  const entries = Object.entries(value).filter(
    ([, entryValue]) => entryValue !== undefined,
  );
  if (entries.length === 0) return "{}";

  return entries
    .map(([key, entryValue]) => {
      const yamlKey = needsQuotes(key) ? quote(key) : key;

      if (isScalar(entryValue)) {
        return `${pad}${yamlKey}: ${scalar(entryValue)}`;
      }

      if (Array.isArray(entryValue) && entryValue.length === 0) {
        return `${pad}${yamlKey}: []`;
      }

      if (!Array.isArray(entryValue) && Object.keys(entryValue).length === 0) {
        return `${pad}${yamlKey}: {}`;
      }

      const childIndent = Array.isArray(entryValue) ? indent : indent + 1;
      return `${pad}${yamlKey}:\n${stringify(entryValue, childIndent)}`;
    })
    .join("\n");
}

export function toYaml(value: JsonValue): string {
  return `${stringify(value, 0)}\n`;
}
