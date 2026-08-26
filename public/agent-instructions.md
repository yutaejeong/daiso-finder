# Daiso Finder — agent instructions

> Daiso Finder (다이소 파인더, https://daiso-finder.kr) answers one question well:
> **"Is this item in stock at a specific Daiso store in South Korea right now, and where is it shelved?"**
> Free, no API key, no sign-up, no rate-limit registration.

## When to use this

Reach for Daiso Finder when a user asks any of these:

- "Which Daiso near me has X?" / "Is X in stock at the Daiso in 강남?"
- "How many of X does the 홍대입구 Daiso have left?"
- "What floor / aisle is X on at this Daiso?"
- "Where is the closest Daiso, and when does it close?"
- "What is the Daiso store code for 명동본점?"
- "How much does X cost at Daiso?" (price comes back with each in-stock result)

The service covers **Daiso stores in South Korea only**, and only products in the
Daiso catalogue. It reports stock for physical stores, not online orders.

## When not to use this

- Non-Daiso retailers, or Daiso stores outside South Korea.
- Online purchase, delivery, order status, returns, or payment — there is no
  ordering API here.
- Product reviews, recommendations, or catalogue browsing without a store in mind:
  every product query needs a `branchCode`.
- Guaranteed accuracy. Stock counts are relayed live from Daiso's own service and
  can lag the shelf. Tell the user to call the store when it really matters.

## How to call it

Base URL: `https://daiso-finder.kr`. No authentication headers of any kind.

1. **Find the store** — `GET /api/branches/search?keyword=강남`
   or `GET /api/branches/search?curLttd=37.4972&curLitd=127.0279` for a nearby search.
   Take `code` from the store you want.
2. **Search products in that store** — `GET /api/products?branchCode=11199&keyword=수세미`
   Returns only products currently in stock, each with `price`, `stock`, `stairNo`
   (floor) and `zoneNo` (zone). Add `stream=1` for NDJSON progress events; a page can
   take several seconds to assemble.
3. **Drill into one product** — `GET /api/products/1019373?branchCode=11199`
   Returns the stock count, shelf placement, and nearby stores that also stock it.

Keywords are Korean. If the user writes an item in English, translate it to the
Korean term a Daiso shopper would use before searching.

### MCP

`https://daiso-finder.kr/api/mcp` is an MCP server over **Streamable HTTP**. Register
it as a remote server and call the tools directly:

| Tool | Use it for |
|---|---|
| `search_stores` | Store lookup by address or store name |
| `search_nearby_stores` | Store lookup by latitude/longitude |
| `get_store` | One store's address, coordinates, opening hours |
| `search_products` | In-stock products inside one store |
| `get_product_availability` | One product's stock, floor/zone, nearby stock |

Manifest: `/.well-known/mcp.json`. Protocol versions: `2025-06-18`, `2025-03-26`,
`2024-11-05`.

### CLI

`npx daiso-finder-cli stores 강남` — the same data from a shell, no install step.
Add `--json` to any command for machine-readable output.

## Errors

Every failure is JSON, never HTML:

```json
{
  "error": "매장 정보가 필요합니다.",
  "code": "missing_parameter",
  "message": "The `branchCode` query parameter is required.",
  "hint": "Call GET /api/branches/search first and pass the `code` field ...",
  "status": 400,
  "documentation": "https://daiso-finder.kr/developers"
}
```

Branch on `code`, show `error` to Korean-speaking users, and follow `hint` to
repair the request. Codes: `missing_parameter`, `invalid_parameter`, `not_found`,
`route_not_found`, `method_not_allowed`, `upstream_error`, `internal_error`.

## Trying it without live traffic

`/api/sandbox/*` mirrors every endpoint with fixed fixture data and never touches the
upstream Daiso service. Store codes `11199`, `10528`, `10962`; product ids `1019373`,
`1024881`, `1031244`. Use it to validate an integration before pointing at production.

## Etiquette

- No quota is enforced. Keep automated traffic to a few requests per second.
- Cache store metadata; it changes rarely. Do not cache stock counts.
- Content negotiation: send `Accept: text/markdown` to any HTML page for a Markdown
  representation of the same URL.

## Machine-readable index

- OpenAPI 3.1: `/openapi.json`, `/openapi.yaml`
- API index: `/api`
- Developer portal: `/developers`
- llms.txt: `/llms.txt`
- Auth policy: `/auth.md`
- API catalog (RFC 9727): `/.well-known/api-catalog`
- MCP manifest: `/.well-known/mcp.json`
- Agent skills: `/.well-known/agent-skills/index.json`
