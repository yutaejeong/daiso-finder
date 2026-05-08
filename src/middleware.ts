import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/markdown")) {
    const url = request.nextUrl.clone();
    const originalPath = request.nextUrl.pathname;
    url.pathname = "/_md";
    url.searchParams.set("path", originalPath);
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_md|favicon|manifest|sitemap|robots|\\.well-known|.*\\..*).*)"],
};
