import { NextRequest, NextResponse } from "next/server";
import { appendVary } from "@/lib/vary";

export function middleware(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";

  if (accept.includes("text/markdown")) {
    const url = request.nextUrl.clone();
    const originalPath = request.nextUrl.pathname;
    url.pathname = "/md";
    url.searchParams.set("path", originalPath);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-daiso-markdown-path", originalPath);
    const rewritten = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    rewritten.headers.set("Vary", appendVary(rewritten.headers.get("Vary")));
    return rewritten;
  }

  // HTML 표현에는 Vary 를 붙이지 않는다. matcher 가 잡는 경로는 모두 앱 라우터
  // 페이지이고, Next 는 렌더 시점에 Vary 를 RSC 값들로 다시 쓰면서 미들웨어가
  // set/append 한 값을 버린다(rewrite 로 바꿔도 동일). 협상된 Markdown 쪽을
  // no-store 로 내려 두 표현이 공유 캐시에서 섞이지 않게 한다.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|md|monitoring|favicon|manifest|sitemap|robots|\\.well-known|.*\\..*).*)",
  ],
};
