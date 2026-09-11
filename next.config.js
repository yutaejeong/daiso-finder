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
      // 여기에 HTML 페이지용 Vary 규칙을 두지 말 것. Next 14 는 앱 라우터 페이지를
      // 렌더할 때 Vary 를 RSC 값들로 다시 써서 headers() 규칙도, 미들웨어가 설정한
      // 값도 모두 덮어쓴다(같은 블록의 Link 등 다른 헤더는 정상 적용된다).
      // 규칙을 남겨두면 적용되는 것처럼 보여 오해를 부르므로 제거했다.
      // 대신 협상된 Markdown 응답을 no-store 로 내려 공유 캐시가 두 표현을
      // 섞지 못하게 막는다. src/app/md/route.ts 참고.
    ];
  },
};

module.exports = withPWA(nextConfig);
