# Search Daiso Stores

Search for Daiso stores in Korea by keyword (address or store name) or GPS coordinates.

## Endpoint

`GET /api/branches/search`

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `keyword` | string | No* | Address or store name |
| `curLttd` | number | No* | Latitude for GPS-based search |
| `curLitd` | number | No* | Longitude for GPS-based search |
| `currentPage` | number | No | Page number (default: 1) |
| `pageSize` | number | No | Results per page (default: 10) |

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

- Use the `code` field with `search_products` to check product stock in a store.
- Supports infinite scroll via the `currentPage` parameter.
- Returns up to 10 results per page; check response length to determine if more pages exist.
