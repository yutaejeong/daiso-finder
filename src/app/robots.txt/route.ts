import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/site";

export function GET() {
  const base = getBaseUrl();
  // /api 는 크롤링 대상이 아니지만, 기계 판독용 발견 문서와 무해한 샌드박스는
  // 에이전트가 찾을 수 있도록 명시적으로 허용한다.
  const allowedApiPaths = `Allow: /api$
Allow: /api/openapi.json
Allow: /api/openapi.yaml
Allow: /api/sandbox
Allow: /api/mcp`;

  const body = `User-agent: *
Allow: /
${allowedApiPaths}
Disallow: /api/
Disallow: /monitoring

User-agent: GPTBot
Allow: /
${allowedApiPaths}
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: OAI-SearchBot
Allow: /
${allowedApiPaths}
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: Claude-Web
Allow: /
${allowedApiPaths}
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: anthropic-ai
Allow: /
${allowedApiPaths}
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=no

User-agent: Google-Extended
Allow: /
${allowedApiPaths}
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
