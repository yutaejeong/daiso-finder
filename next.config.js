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
      // HTML 문서는 Accept 헤더로 Markdown 표현과 협상되므로 Vary 에 Accept 가
      // 있어야 CDN 이 한쪽 표현을 다른 요청에 재사용하지 않는다. Next 가 앱
      // 라우트 응답에 강제로 넣는 RSC 값들을 잃지 않도록 함께 나열한다.
      ...[
        "/",
        "/about",
        "/contact",
        "/privacy",
        "/developers",
        "/branch/:code*",
      ].map((source) => ({
        source,
        headers: [
          {
            key: "Vary",
            value:
              "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept, Accept-Encoding",
          },
        ],
      })),
    ];
  },
};

module.exports = withPWA(nextConfig);
