#!/usr/bin/env node
import { buildUrl, parseArgs, UsageError } from "./args.mjs";
import {
  formatApiError,
  formatAvailability,
  formatProducts,
  formatStore,
  formatStores,
} from "./format.mjs";

const VERSION = "1.0.0";

const HELP = `daiso-finder — Daiso Finder CLI

Find Daiso stores in South Korea and check in-store product stock, price,
and shelf location. No API key, no sign-up.

Usage
  daiso-finder stores <keyword>              매장을 주소·지점명으로 검색
  daiso-finder nearby <lat> <lng>            좌표로 주변 매장 검색
  daiso-finder store <branchCode>            매장 단건 조회
  daiso-finder products <branchCode> <name>  매장 안 상품 재고 검색
  daiso-finder product <productId> <branchCode>
                                             상품 단건의 재고·진열 위치

Options
  --json               JSON 그대로 출력 (스크립트용)
  --sandbox            고정 픽스처 엔드포인트(/api/sandbox) 사용
  --base-url <url>     기본 https://daiso-finder.kr
  --page <n>           페이지 번호 (기본 1)
  --page-size <n>      매장 검색 결과 수 (기본 10, 최대 10)
  -h, --help           이 도움말
  -v, --version        버전

Examples
  daiso-finder stores 강남
  daiso-finder products 11199 수세미 --json
  daiso-finder products 11199 수세미 --sandbox

Docs  https://daiso-finder.kr/developers
`;

async function requestJson(url) {
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error(`${url.origin} 에 연결하지 못했습니다: ${error.message}`);
  }

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `JSON 이 아닌 응답을 받았습니다 (HTTP ${response.status}): ${text.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    throw new Error(formatApiError(body, response.status));
  }

  return body;
}

const COMMANDS = {
  async stores(args, options) {
    const keyword = args.join(" ").trim();
    if (!keyword) {
      throw new UsageError("검색어가 필요합니다. 예: daiso-finder stores 강남");
    }

    const url = buildUrl("/branches/search", options, {
      keyword,
      currentPage: options.page,
      pageSize: options.pageSize,
    });

    const data = await requestJson(url);
    return { data, text: formatStores(data) };
  },

  async nearby(args, options) {
    const [lat, lng] = args;
    if (!lat || !lng) {
      throw new UsageError(
        "위도와 경도가 필요합니다. 예: daiso-finder nearby 37.4972 127.0279",
      );
    }

    const url = buildUrl("/branches/search", options, {
      curLttd: lat,
      curLitd: lng,
      currentPage: options.page,
      pageSize: options.pageSize,
    });

    const data = await requestJson(url);
    return { data, text: formatStores(data) };
  },

  async store(args, options) {
    const [code] = args;
    if (!code) {
      throw new UsageError(
        "매장 코드가 필요합니다. 예: daiso-finder store 11199",
      );
    }

    const data = await requestJson(
      buildUrl(`/branches/${encodeURIComponent(code)}`, options),
    );
    return { data, text: formatStore(data) };
  },

  async products(args, options) {
    const [branchCode, ...rest] = args;
    const keyword = rest.join(" ").trim();

    if (!branchCode || !keyword) {
      throw new UsageError(
        "매장 코드와 상품명이 필요합니다. 예: daiso-finder products 11199 수세미",
      );
    }

    const url = buildUrl("/products", options, {
      branchCode,
      keyword,
      currentPage: options.page,
    });

    const data = await requestJson(url);
    return { data, text: formatProducts(data) };
  },

  async product(args, options) {
    const [productId, branchCode] = args;
    if (!productId || !branchCode) {
      throw new UsageError(
        "상품 번호와 매장 코드가 필요합니다. 예: daiso-finder product 1019373 11199",
      );
    }

    const url = buildUrl(
      `/products/${encodeURIComponent(productId)}`,
      options,
      {
        branchCode,
      },
    );

    const data = await requestJson(url);
    return { data, text: formatAvailability(data) };
  },
};

export async function run(argv) {
  const { command, args, options } = parseArgs(argv);

  if (options.version) {
    return { text: VERSION, code: 0 };
  }

  if (options.help || !command) {
    return { text: HELP, code: command ? 0 : options.help ? 0 : 1 };
  }

  const handler = COMMANDS[command];
  if (!handler) {
    throw new UsageError(
      `알 수 없는 명령입니다: ${command}\n사용 가능한 명령: ${Object.keys(COMMANDS).join(", ")}`,
    );
  }

  const { data, text } = await handler(args, options);
  return { text: options.json ? JSON.stringify(data, null, 2) : text, code: 0 };
}

const isDirectRun =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  try {
    const { text, code } = await run(process.argv.slice(2));
    process.stdout.write(`${text}\n`);
    process.exit(code);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    if (error instanceof UsageError) {
      process.stderr.write("\ndaiso-finder --help 로 사용법을 확인하세요.\n");
    }
    process.exit(1);
  }
}
