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
          "sha256:ffabe3dac8353f2f432af57c4074f07b1fd9f257bf0a355155430423afe45226",
      },
      {
        name: "search-products",
        type: "skill-md",
        description:
          "Search product stock and shelf location in a specific Daiso store via GET /api/products",
        url: `${base}/.well-known/agent-skills/search-products/SKILL.md`,
        digest:
          "sha256:44ad6ed9ccc3bb356f85de4f3e3850f3c66c28083f5af3471c62c0eb04814110",
      },
    ],
  };

  return NextResponse.json(index);
}
