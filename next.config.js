/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
});

const WEBMCP_ORIGIN_TRIAL_TOKEN =
  process.env.WEBMCP_ORIGIN_TRIAL_TOKEN?.trim();

function sharedHeaders() {
  const headers = [
    {
      key: "Link",
      value: [
        '</llms.txt>; rel="describedby"; type="text/plain"',
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
    ];
  },
};

module.exports = withPWA(nextConfig);
