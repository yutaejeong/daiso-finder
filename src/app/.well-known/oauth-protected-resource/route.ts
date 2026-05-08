import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  return NextResponse.json(
    {
      resource: base,
      authorization_servers: [],
      scopes_supported: [],
      bearer_methods_supported: [],
      resource_documentation: `${base}/.well-known/api-catalog`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
