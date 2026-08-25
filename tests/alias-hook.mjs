import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);

const PREFIXES = [
  { prefix: "@/", target: "src/" },
  { prefix: "@styled-system/", target: "styled-system/" },
];

const EXTENSIONS = [
  "",
  ".ts",
  ".tsx",
  ".mjs",
  ".js",
  "/index.ts",
  "/index.mjs",
];

/**
 * tsconfig 의 경로 별칭을 node:test 러너에서도 쓰기 위한 resolve 훅.
 * Node 는 확장자 없는 지정자를 스스로 해석하지 않으므로 후보를 직접 훑는다.
 */
export async function resolve(specifier, context, nextResolve) {
  const match = PREFIXES.find((entry) => specifier.startsWith(entry.prefix));

  if (!match) {
    return nextResolve(specifier, context);
  }

  const relative = specifier.slice(match.prefix.length);

  for (const extension of EXTENSIONS) {
    const candidate = new URL(`${match.target}${relative}${extension}`, ROOT);
    if (existsSync(fileURLToPath(candidate))) {
      return nextResolve(candidate.href, context);
    }
  }

  throw new Error(`Cannot resolve alias "${specifier}"`);
}
