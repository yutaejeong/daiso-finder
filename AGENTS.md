# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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

Search conditions live in the URL query string (`?q=`, or `?lat=&lng=` for the home page's
location search) so browser back/forward restores them. `src/lib/searchParams.ts` parses and
serializes them, `src/hooks/useUrlSearchParams.ts` reads the query string and updates it with
`history.pushState` (no RSC round trip, synced back via `popstate`), and the cache windows in
`src/lib/queryCache.ts` keep the results around so returning from a detail page does not
re-search. `useSearchParams()` is deliberately avoided — it would push `/` out of static
rendering. Result lists scroll inside their own container, so `Search` restores their scroll
position via `src/hooks/useScrollRestoration.ts`.

### Analytics

GA4 tracks the whole visit as a journey: acquisition → funnel → exit. See
`docs/analytics.md` for the event dictionary and the GA4 console setup.

- `src/lib/gtag.ts` owns the dataLayer bootstrap. It pushes `js`/`config` before any
  event so nothing queued before gtag.js loads gets dropped, and it configures with
  `send_page_view: false` — page views are sent by hand so they carry journey params.
  Do not re-add an inline gtag snippet; that is what caused duplicate page views.
- `src/lib/journey.ts` defines `JOURNEY_STEPS` (the funnel, in order), classifies the
  entry channel, and keeps the per-session journey state in `sessionStorage`. Every
  event carries the entry params and the current step: `setEventDefaults()` merges
  them in `trackEvent()`, because GA4 drops custom params passed to `gtag('set')`.
- `src/hooks/useJourneyTracking.ts` wires page views, engaged time, scroll depth,
  outbound clicks, and the `page_exit` event to browser events.
- Fire funnel steps with `trackJourneyStep()` only — it also updates the state that
  the exit event reports as `reached_step`. Adding a step means appending to
  `JOURNEY_STEPS` (inserting in the middle renumbers past data) and updating
  `docs/analytics.md`.

### Search-term collection

Every keyword search — store search and in-store product search — is appended to a
Google Sheet through an Apps Script web app. See `docs/search-logs.md` for the sheet
setup and the Apps Script source.

- `src/lib/searchLog.ts` owns it. `logSearch()` never blocks or fails a search response,
  and the whole thing stays off unless `SEARCH_LOG_WEBHOOK_URL` is set.
- The two API routes (`/api/branches/search`, `/api/products`) call it after the results
  are in, and only for the first page — later pages of infinite scroll are the same search.
- Location-only store searches have no keyword, so nothing is recorded for them.
- The web UI sends `x-search-source: web` (`SEARCH_SOURCE_HEADER`) so the sheet can tell
  site searches apart from direct API/MCP/CLI calls. Changing the row shape means changing
  `HEADERS` in the Apps Script too, and the privacy page describes what is stored.

### Error tracking

Sentry (`@sentry/nextjs`) reports crashes from all three runtimes. See `docs/sentry.md`
for the setup and what is deliberately left unreported.

- `src/lib/sentry.ts` builds the options the three runtimes share and owns the scrubbing.
  It imports no SDK code so the options and the scrubbing stay unit-testable.
- `sentry.{client,server,edge}.config.ts` sit at the repo root — the Sentry webpack
  plugin looks for those exact paths. `src/instrumentation.ts` loads the server/edge
  ones, which needs `experimental.instrumentationHook` on Next 14.
- Everything stays off unless `NEXT_PUBLIC_SENTRY_DSN` is set, and source maps are only
  built and uploaded when `SENTRY_AUTH_TOKEN` is present, so a token-less build is clean.
- API routes turn every error into JSON, so nothing reaches Sentry's automatic
  instrumentation. `internalError()` in `src/lib/apiError.ts` reports 500s by hand;
  `upstreamError()` deliberately stays silent (expected Daiso API failures).
- Search terms and coordinates never leave in a report: four hooks
  (`beforeSend`, `beforeSendTransaction`, `beforeSendSpan`, `beforeBreadcrumb`) redact
  the `SENSITIVE_QUERY_KEYS` query params. `beforeSend` only sees error events, so
  dropping the transaction/span hooks would leak keywords through performance traces.
  Renaming a param in `src/lib/searchParams.ts` means updating that list — a test
  enforces it.
- Tests load `tests/sentryStub.mjs` instead of the real SDK (`STUBS` in
  `tests/alias-hook.mjs`); Node's ESM interop cannot read the SDK's CJS named exports.

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
