# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daiso Finder is a Next.js 14 PWA (App Router) that helps users find Daiso stores and search for product stock/location within stores. Written in TypeScript, styled with PandaCSS + Tabler UI.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Test:** `pnpm test` (Node built-in test runner; add `DAISO_E2E_BASE_URL=http://localhost:3000` to also run the HTTP endpoint checks against a running server)
- **PandaCSS codegen:** `pnpm prepare` (run after changing panda.config.ts or when styled-system is stale)

Tests live in `tests/*.test.mjs` and run on `node --test`. `tests/register.mjs` installs a
resolve hook so tests can import `@/…` aliases and TypeScript sources directly.

## Architecture

### API Proxy Pattern

All external Daiso API calls are proxied through Next.js API routes (`src/app/api/`) to avoid CORS and limit exposed data. The external API base URL is set via `NEXT_PUBLIC_API_URL` in `.env`.

- `GET /api/branches/search` — search stores by keyword or GPS coordinates (infinite scroll)
- `GET /api/branches/[code]` — get single store details
- `GET /api/products` — multi-step: search products → check stock → get shelf placement, returns only in-stock items
- `GET /api/products/[id]` — one product's stock, shelf placement, and nearby stores that stock it
- `GET /api` — machine-readable index of every operation and discovery document
- `GET /api/sandbox/**` — fixture-backed copies of the endpoints above (`src/lib/sandboxFixtures.ts`), no upstream calls
- `ANY /api/**` (unmatched) — `src/app/api/[...unknown]/route.ts` answers with a JSON 404 instead of Next's HTML page

All error responses go through `src/lib/apiError.ts` so every failure carries
`{ error, code, message, hint, status, documentation, detail? }`. Adding a new error code
means updating both `API_ERROR_CODES` and the `Error` schema enum in `src/lib/openapi.ts` —
a test asserts they stay in sync.

### Agent-facing surface

- `src/lib/openapi.ts` is the single source of truth for `/openapi.json`, `/openapi.yaml`,
  `/api/openapi.{json,yaml}` and the `/api` index. `src/lib/yaml.ts` renders the YAML variant.
- `src/lib/mcpTools.ts` holds the MCP tool definitions shared by `/api/mcp`,
  `/.well-known/mcp.json` and `/.well-known/mcp/server-card.json`. `/api/mcp` speaks
  JSON-RPC 2.0 over Streamable HTTP (JSON by default, SSE for clients that only accept it).
- `src/lib/jsonLd.ts` builds the homepage Organization/WebSite/WebApplication graph.
- `src/middleware.ts` serves a Markdown representation of any HTML page for
  `Accept: text/markdown` and merges `Accept` into `Vary`. Because Next.js overwrites
  `Vary` for app routes, the HTML variant also gets it from the `headers()` rules in
  `next.config.js`, which the hosting edge applies after the response is produced.
- Static agent files live in `public/`: `llms.txt`, `agent-instructions.md`, `auth.md`,
  `.well-known/agent-skills/*/SKILL.md`. Changing a SKILL.md means updating its sha256
  digest in `src/app/.well-known/agent-skills/index.json/route.ts` (a test enforces this).

### Pages that must stay server-rendered

`/`, `/about`, `/contact`, `/privacy`, and `/developers` render their body text on the
server so crawlers and agents see it without running JavaScript. The homepage keeps the
interactive search in `src/app/HomeClient.tsx` and wraps it in a server component; the
`body` is a fixed 100dvh shell, so long pages scroll inside their own container rather than
changing the global layout.

### CLI

`cli/` is a separately published npm package (`daiso-finder-cli`) that wraps the public API.
It has no dependency on the Next.js app and is covered by `tests/cli.test.mjs`.

### Pages

- `/` (home) — store selector with keyword search and geolocation-based search, infinite scroll pagination, plus server-rendered service copy below the fold
- `/branch/[code]` — store detail page with product search showing price, stock count, floor/zone info
- `/developers` — developer portal (quickstart, endpoints, error codes, MCP, CLI, sandbox)
- `/about`, `/contact`, `/privacy` — trust anchor pages

### Client State

React Query (`@tanstack/react-query`) handles all server state, caching, and pagination. Provider is in `src/app/provider.tsx`.

### Styling

- **PandaCSS** for CSS-in-JS — use `css()` from `@styled-system/css`
- **Tabler UI** for pre-built components and layout
- Generated styles live in `styled-system/` (gitignored, regenerated via `pnpm prepare`)
- Theme color: **#e60033**
- Font: Pretendard (Korean)

### Path Aliases

- `@/*` → `./src/*`
- `@styled-system/*` → `./styled-system/*`

## Development Rules

- Package manager: **pnpm** (do not use npm/yarn)
- Node version: 22.17.1 (see .nvmrc)
- Prefer Tabler UI components and utilities before adding new UI libraries — see https://docs.tabler.io/ui
- Check existing dependencies in package.json before installing new packages
- Next.js config uses `next.config.js` (not .mjs/.ts) with JSDoc types
- Remote images allowed from `cdn.daisomall.co.kr`
