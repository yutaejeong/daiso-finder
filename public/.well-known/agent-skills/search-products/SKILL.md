---
name: search-products
description: Search product stock, price, floor, and shelf zone in a specific Daiso store. Use when a user asks whether a product is available at a Daiso branch.
---

# Search Products in Daiso Store

Use this skill when a user asks whether a product is in stock at a specific Daiso store, or asks for product price, stock count, floor, or shelf zone.

## Required flow

1. If the user gives a store name instead of a code, call `/api/branches/search` first.
2. Use the selected store's `code` as `branchCode`.
3. Call `/api/products` with `branchCode` and `keyword`.

## Endpoint

`GET /api/products`

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `branchCode` | string | Yes | Store code from `/api/branches/search` |
| `keyword` | string | Yes | Product name to search |
| `currentPage` | number | No | Page number (default: 1) |

Backward compatibility: `branchCd` is accepted, but agents should prefer `branchCode`.

## Response

Object with in-stock products and pagination info:

```json
{
  "products": [
    {
      "id": "123456",
      "name": "수세미",
      "price": 1000,
      "image": "https://cdn.daisomall.co.kr/...",
      "stock": 5,
      "stairNo": 1,
      "zoneNo": 3
    }
  ],
  "hasMore": false,
  "nextPage": 2
}
```

## Notes

- Only returns products with available stock (`stock > 0`).
- `stairNo` is the floor number within the store.
- `zoneNo` is the zone/section number on that floor.
- `price` is in Korean Won (KRW).
- Get `branchCode` from `search_stores` results (`code` field).

## MCP tool

Use `search_products` on `/api/mcp` with:

```json
{
  "branchCode": "0001",
  "keyword": "배터리",
  "currentPage": 1
}
```
