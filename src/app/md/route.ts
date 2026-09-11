import { NextRequest } from "next/server";
import { buildMarkdownForPath } from "@/lib/appMarkdown";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const path =
    request.headers.get("x-daiso-markdown-path") ??
    request.nextUrl.searchParams.get("path") ??
    "/";
  const markdown = buildMarkdownForPath(path);

  const byteLen = new TextEncoder().encode(markdown).length;

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // HTML 표현과 같은 URL 을 공유하므로 캐시 키에 Accept 가 포함돼야 한다.
      Vary: "Accept, Accept-Encoding",
      "x-markdown-tokens": String(Math.ceil(byteLen / 4)),
    },
  });
}
