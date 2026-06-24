import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  const catalog = {
    linkset: [
      {
        anchor: `${base}/api/branches/search`,
        "service-doc": [
          {
            href: `${base}/.well-known/agent-skills/search-stores/SKILL.md`,
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: `${base}/api/branches`,
        "service-doc": [
          {
            href: `${base}/.well-known/agent-skills/search-stores/SKILL.md`,
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: `${base}/api/products`,
        "service-doc": [
          {
            href: `${base}/.well-known/agent-skills/search-products/SKILL.md`,
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: `${base}/api/mcp`,
        "service-desc": [
          {
            href: `${base}/.well-known/mcp/server-card.json`,
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: `${base}/llms.txt`,
            type: "text/plain",
          },
        ],
      },
    ],
  };

  return NextResponse.json(catalog, {
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
    },
  });
}
