import { NextRequest, NextResponse } from "next/server";
import { appendVary } from "@/lib/vary";

export function middleware(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";

  if (accept.includes("text/markdown")) {
    const url = request.nextUrl.clone();
    const originalPath = request.nextUrl.pathname;
    url.pathname = "/md";
    url.searchParams.set("path", originalPath);
    const rewritten = NextResponse.rewrite(url);
    rewritten.headers.set("Vary", appendVary(rewritten.headers.get("Vary")));
    return rewritten;
  }

  const response = NextResponse.next();
  response.headers.set("Vary", appendVary(response.headers.get("Vary")));
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|md|favicon|manifest|sitemap|robots|\\.well-known|.*\\..*).*)",
  ],
};
