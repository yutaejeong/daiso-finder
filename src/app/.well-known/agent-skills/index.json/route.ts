import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  const index = {
    $schema:
      "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "search-stores",
        type: "skill-md",
        description:
          "Search for Daiso stores in Korea by keyword or GPS coordinates via GET /api/branches/search",
        url: `${base}/.well-known/agent-skills/search-stores/SKILL.md`,
        digest:
          "sha256:9a525ebc456c64d9a393c471870ff25afaede73f41588ba3e0be3b3b6aa5486d",
      },
      {
        name: "search-products",
        type: "skill-md",
        description:
          "Search product stock and shelf location in a specific Daiso store via GET /api/products",
        url: `${base}/.well-known/agent-skills/search-products/SKILL.md`,
        digest:
          "sha256:e8e3f201f90db1a2e3e747236120a32dd2e8454b867f27915b6736fe3eedb4b0",
      },
    ],
  };

  return NextResponse.json(index);
}
