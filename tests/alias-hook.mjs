import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);

const PREFIXES = [
  { prefix: "@/", target: "src/" },
  { prefix: "@styled-system/", target: "styled-system/" },
];

/**
 * 테스트에서 진짜 모듈 대신 쓸 대역. 이유는 각 대역 파일 위쪽에 적어 둔다.
 */
const STUBS = {
  "@sentry/nextjs": "tests/sentryStub.mjs",
};

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
 * orval 이 생성한 코드(`src/generated/…`)는 `../../lib/daisoApiClient` 처럼 확장자
 * 없는 상대 경로를 쓴다. 번들러는 알아서 붙이지만 Node ESM 은 그러지 않으므로,
 * 기본 해석이 실패했을 때만 후보 확장자를 훑어준다.
 */
async function resolveWithExtensions(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!specifier.startsWith(".") || !context.parentURL) {
      throw error;
    }

    for (const extension of EXTENSIONS) {
      if (!extension) {
        continue;
      }
      const candidate = new URL(`${specifier}${extension}`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(candidate.href, context);
      }
    }

    throw error;
  }
}

/**
 * tsconfig 의 경로 별칭을 node:test 러너에서도 쓰기 위한 resolve 훅.
 * Node 는 확장자 없는 지정자를 스스로 해석하지 않으므로 후보를 직접 훑는다.
 */
export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS[specifier];
  if (stub) {
    return nextResolve(new URL(stub, ROOT).href, context);
  }

  const match = PREFIXES.find((entry) => specifier.startsWith(entry.prefix));

  if (!match) {
    return resolveWithExtensions(specifier, context, nextResolve);
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
