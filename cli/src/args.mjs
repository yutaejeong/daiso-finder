export const DEFAULT_BASE_URL = "https://daiso-finder.kr";

export class UsageError extends Error {}

const FLAGS_WITH_VALUE = new Set(["--base-url", "--page", "--page-size"]);
const BOOLEAN_FLAGS = new Set(["--json", "--sandbox", "--help", "--version"]);

/**
 * argv 를 명령과 옵션으로 나눈다. 알 수 없는 플래그는 조용히 무시하지 않고
 * 바로 오류로 알려 잘못된 호출이 빈 결과처럼 보이지 않게 한다.
 */
export function parseArgs(argv) {
  const positional = [];
  const options = {
    baseUrl: process.env.DAISO_FINDER_BASE_URL || DEFAULT_BASE_URL,
    json: false,
    sandbox: false,
    help: false,
    version: false,
    page: 1,
    pageSize: 10,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "-v") {
      options.version = true;
      continue;
    }

    if (BOOLEAN_FLAGS.has(arg)) {
      options[arg.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = true;
      continue;
    }

    if (FLAGS_WITH_VALUE.has(arg)) {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new UsageError(`Missing value for ${arg}`);
      }
      index += 1;

      if (arg === "--base-url") {
        options.baseUrl = value.replace(/\/$/, "");
      } else if (arg === "--page") {
        options.page = toPositiveInt(value, arg);
      } else {
        options.pageSize = toPositiveInt(value, arg);
      }
      continue;
    }

    if (arg.startsWith("--")) {
      throw new UsageError(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  return { command: positional[0], args: positional.slice(1), options };
}

function toPositiveInt(value, flag) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new UsageError(`${flag} expects a positive integer, got "${value}"`);
  }
  return parsed;
}

/** 샌드박스 모드면 모든 요청이 픽스처 엔드포인트로 향한다. */
export function apiRoot(options) {
  return options.sandbox
    ? `${options.baseUrl}/api/sandbox`
    : `${options.baseUrl}/api`;
}

export function buildUrl(path, options, query = {}) {
  const url = new URL(`${apiRoot(options)}${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}
