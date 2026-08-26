import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  const openApiDesc = [
    { href: `${base}/openapi.json`, type: "application/json" },
    { href: `${base}/openapi.yaml`, type: "application/yaml" },
  ];

  const catalog = {
    linkset: [
      {
        anchor: `${base}/api`,
        "service-desc": openApiDesc,
        "service-doc": [
          { href: `${base}/developers`, type: "text/html" },
          { href: `${base}/agent-instructions.md`, type: "text/markdown" },
        ],
        "service-meta": [{ href: `${base}/auth.md`, type: "text/markdown" }],
        status: [{ href: `${base}/api`, type: "application/json" }],
      },
      {
        anchor: `${base}/api/branches/search`,
        "service-desc": openApiDesc,
        "service-doc": [
          {
            href: `${base}/.well-known/agent-skills/search-stores/SKILL.md`,
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: `${base}/api/branches`,
        "service-desc": openApiDesc,
        "service-doc": [
          {
            href: `${base}/.well-known/agent-skills/search-stores/SKILL.md`,
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: `${base}/api/products`,
        "service-desc": openApiDesc,
        "service-doc": [
          {
            href: `${base}/.well-known/agent-skills/search-products/SKILL.md`,
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: `${base}/api/sandbox`,
        "service-desc": openApiDesc,
        "service-doc": [{ href: `${base}/developers`, type: "text/html" }],
      },
      {
        anchor: `${base}/api/mcp`,
        "service-desc": [
          {
            href: `${base}/.well-known/mcp.json`,
            type: "application/json",
          },
          {
            href: `${base}/.well-known/mcp/server-card.json`,
            type: "application/json",
          },
        ],
        "service-doc": [
          { href: `${base}/llms.txt`, type: "text/plain" },
          { href: `${base}/agent-instructions.md`, type: "text/markdown" },
        ],
      },
    ],
  };

  return NextResponse.json(catalog, {
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      "Access-Control-Allow-Origin": "*",
    },
  });
}
