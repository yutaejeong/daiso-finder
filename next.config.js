const { withSentryConfig } = require("@sentry/nextjs/config");

/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
});

const WEBMCP_ORIGIN_TRIAL_TOKEN = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN?.trim();

function sharedHeaders() {
  const headers = [
    {
      key: "Link",
      value: [
        '</llms.txt>; rel="describedby"; type="text/plain"',
        '</agent-instructions.md>; rel="help"; type="text/markdown"',
        '</openapi.json>; rel="service-desc"; type="application/json"',
        '</.well-known/mcp.json>; rel="service-desc"; type="application/json"',
        '</developers>; rel="service-doc"; type="text/html"',
        '</.well-known/api-catalog>; rel="api-catalog"',
        '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
        '</sitemap.xml>; rel="sitemap"',
        '</.well-known/agent-skills/index.json>; rel="describedby"',
      ].join(", "),
    },
    {
      key: "Origin-Agent-Cluster",
      value: "?1",
    },
    {
      key: "Permissions-Policy",
      value: "tools=(self)",
    },
  ];

  if (WEBMCP_ORIGIN_TRIAL_TOKEN) {
    headers.push({
      key: "Origin-Trial",
      value: WEBMCP_ORIGIN_TRIAL_TOKEN,
    });
  }

  return headers;
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // src/instrumentation.ts 를 켜는 스위치. Next 15 부터는 기본값이다.
    instrumentationHook: true,
    outputFileTracingIncludes: {
      "/opengraph-image": [
        "./src/app/NotoSansCJKkr-Regular.otf",
        "./public/logo.svg",
      ],
      "/branch/[code]/opengraph-image": [
        "./src/app/NotoSansCJKkr-Regular.otf",
        "./public/logo.svg",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.daisomall.co.kr",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: sharedHeaders(),
      },
      // 여기에 HTML 페이지용 Vary 규칙을 두지 말 것. Next 14 는 앱 라우터 페이지를
      // 렌더할 때 Vary 를 RSC 값들로 다시 써서 headers() 규칙도, 미들웨어가 설정한
      // 값도 모두 덮어쓴다(같은 블록의 Link 등 다른 헤더는 정상 적용된다).
      // 규칙을 남겨두면 적용되는 것처럼 보여 오해를 부르므로 제거했다.
      // 대신 협상된 Markdown 응답을 no-store 로 내려 공유 캐시가 두 표현을
      // 섞지 못하게 막는다. src/app/md/route.ts 참고.
    ];
  },
};

/**
 * Sentry 빌드 설정. 소스맵 업로드는 SENTRY_AUTH_TOKEN 이 있을 때만 한다.
 * 토큰 없이 빌드해도(로컬, PR CI) 경고 한 줄 없이 그대로 성공해야 한다.
 * 자세한 설정은 docs/sentry.md 참고.
 */
module.exports = withSentryConfig(withPWA(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // 이 프로젝트의 Sentry 조직은 EU 리전(ingest.de.sentry.io)이다. 업로드 기본값은
  // sentry.io 라서 그대로 두면 소스맵만 조용히 실패한다.
  sentryUrl: process.env.SENTRY_URL || "https://de.sentry.io",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  // 스택 트레이스를 원본 코드로 되돌리려면 소스맵이 필요하다. 업로드한 뒤에는
  // 빌드 결과물에서 지워 브라우저로 원본 코드가 새어 나가지 않게 한다.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  widenClientFileUpload: true,
  // 브라우저에서 Sentry 로 바로 나가는 요청은 광고·추적 차단기에 흔히 막힌다.
  // 같은 도메인의 이 경로로 우회시켜 클라이언트 오류가 통째로 사라지지 않게 한다.
  // 서버가 대신 전달하므로 미들웨어를 태울 이유도 없다(src/middleware.ts 참고).
  tunnelRoute: "/monitoring",
  webpack: {
    // Sentry 자체 디버그 로거는 번들에서 뺀다.
    treeshake: { removeDebugLogging: true },
  },
});
