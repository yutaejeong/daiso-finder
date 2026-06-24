---
name: search-stores
description: Search for Daiso stores in Korea by keyword, address, store name, or GPS coordinates. Use when a user needs a Daiso branch code, address, opening hours, or nearby store list.
---

# Search Daiso Stores

Use this skill when a user asks for a Daiso branch, store address, opening hours, or a store code to use with product stock lookup.

## Endpoint

`GET /api/branches/search`

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `keyword` | string | No* | Address or store name |
| `curLttd` | number | No* | Latitude for GPS-based search |
| `curLitd` | number | No* | Longitude for GPS-based search |
| `currentPage` | number | No | Page number (default: 1) |
| `pageSize` | number | No | Results per page (default: 10, max: 10) |

*Either `keyword` or both `curLttd`/`curLitd` must be provided.

## Response

Array of store objects:

```json
[
  {
    "code": "0001",
    "name": "다이소 강남점",
    "lat": 37.497175,
    "lng": 127.027926,
    "address": "서울특별시 강남구 강남대로 438",
    "openTime": "10:00",
    "closeTime": "22:00"
  }
]
```

## Notes

- Use the `code` field as `branchCode` with product tools and APIs.
- Supports infinite scroll via the `currentPage` parameter.
- Returns up to 10 results per page; check response length to determine if more pages exist.

## MCP tools

- `search_stores`: search by keyword.
- `search_nearby_stores`: search by coordinates.
- `get_store`: fetch one store by `branchCode`.

MCP endpoint: `/api/mcp`.
