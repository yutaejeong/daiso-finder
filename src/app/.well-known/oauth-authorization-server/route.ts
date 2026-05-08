import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  return NextResponse.json(
    {
      issuer: base,
      response_types_supported: [],
      grant_types_supported: [],
      scopes_supported: [],
      token_endpoint_auth_methods_supported: [],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
