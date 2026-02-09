# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daiso Finder is a Next.js 14 PWA (App Router) that helps users find Daiso stores and search for product stock/location within stores. Written in TypeScript, styled with PandaCSS + Tabler UI.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **PandaCSS codegen:** `pnpm prepare` (run after changing panda.config.ts or when styled-system is stale)

No test framework is configured.

## Architecture

### API Proxy Pattern

All external Daiso API calls are proxied through Next.js API routes (`src/app/api/`) to avoid CORS and limit exposed data. The external API base URL is set via `NEXT_PUBLIC_API_URL` in `.env`.

- `GET /api/branches/search` — search stores by keyword or GPS coordinates (infinite scroll)
- `GET /api/branches/[code]` — get single store details
- `GET /api/products` — multi-step: search products → check stock → get shelf placement, returns only in-stock items

### Pages

- `/` (home) — store selector with keyword search and geolocation-based search, infinite scroll pagination
- `/branch/[code]` — store detail page with product search showing price, stock count, floor/zone info

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
- Prefer Tabler UI components and utilities before adding new UI libraries
- Check existing dependencies in package.json before installing new packages
- Next.js config uses `next.config.js` (not .mjs/.ts) with JSDoc types
- Remote images allowed from `cdn.daisomall.co.kr`
