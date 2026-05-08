import { NextResponse } from "next/server";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function GET() {
  const base = getBaseUrl();
  const body = `User-agent: *
Allow: /
Disallow: /api/

User-agent: GPTBot
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: OAI-SearchBot
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: Claude-Web
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: anthropic-ai
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: Google-Extended
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: Amazonbot
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: Applebot-Extended
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: Bytespider
Disallow: /
Content-Signal: ai-train=no, search=no, ai-input=no

User-agent: CCBot
Disallow: /
Content-Signal: ai-train=no, search=no, ai-input=no

Sitemap: ${base}/sitemap.xml
`;

  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
