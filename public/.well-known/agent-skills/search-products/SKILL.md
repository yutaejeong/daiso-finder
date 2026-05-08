# Search Products in Daiso Store

Search for product stock and shelf location in a specific Daiso store.

## Endpoint

`GET /api/products`

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `branchCd` | string | Yes | Store code from `/api/branches/search` |
| `keyword` | string | Yes | Product name to search |

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
- Get `branchCd` from `search_stores` results (`code` field).
