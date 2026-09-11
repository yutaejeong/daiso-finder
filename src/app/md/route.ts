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
      // 앱 라우터 페이지 응답의 Vary 는 Next 가 렌더 시점에 덮어쓰기 때문에
      // HTML 표현에는 Accept 를 넣을 수 없다(next.config.js 의 headers() 규칙도
      // 무시된다). Vary 를 믿을 수 없는 중간 캐시가 이 Markdown 응답을 저장해
      // 브라우저 요청에 재사용하는 일이 없도록 아예 저장을 막는다. 본문은
      // 정적 문자열이라 매번 생성해도 비용이 없다.
      "Cache-Control": "private, no-store",
      "x-markdown-tokens": String(Math.ceil(byteLen / 4)),
    },
  });
}
