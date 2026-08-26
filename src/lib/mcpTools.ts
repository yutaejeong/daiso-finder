/**
 * MCP 도구 정의. `/api/mcp` 와 `/.well-known/mcp/server-card.json`,
 * `/.well-known/mcp.json` 이 같은 목록을 쓰도록 한 곳에 둔다.
 */
export const MCP_TOOLS = [
  {
    name: "search_stores",
    title: "Search Daiso stores",
    description:
      "Search Daiso stores by address or store name. Use a returned code as branchCode for product tools.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "Address or store name" },
        currentPage: {
          type: "number",
          description: "Page number",
          default: 1,
        },
        pageSize: {
          type: "number",
          description: "Results per page, max 10",
          default: 10,
        },
      },
      required: ["keyword"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  {
    name: "search_nearby_stores",
    title: "Search nearby Daiso stores",
    description:
      "Search nearby Daiso stores by latitude and longitude. Use a returned code as branchCode.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number", description: "Current latitude" },
        longitude: { type: "number", description: "Current longitude" },
        currentPage: {
          type: "number",
          description: "Page number",
          default: 1,
        },
        pageSize: {
          type: "number",
          description: "Results per page, max 10",
          default: 10,
        },
      },
      required: ["latitude", "longitude"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  {
    name: "get_store",
    title: "Get one Daiso store",
    description:
      "Get Daiso store details for a branchCode, including address, coordinates, and opening hours.",
    inputSchema: {
      type: "object",
      properties: {
        branchCode: {
          type: "string",
          description: "Store code from search_stores",
        },
      },
      required: ["branchCode"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  {
    name: "search_products",
    title: "Search in-store products",
    description:
      "Search product stock, price, floor, and zone inside a Daiso store. Requires branchCode.",
    inputSchema: {
      type: "object",
      properties: {
        branchCode: {
          type: "string",
          description: "Store code from search_stores",
        },
        keyword: { type: "string", description: "Product name to search" },
        currentPage: {
          type: "number",
          description: "Page number",
          default: 1,
        },
      },
      required: ["branchCode", "keyword"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  {
    name: "get_product_availability",
    title: "Get product availability",
    description:
      "Get one product's stock count and shelf placement in a Daiso store, plus nearby stores that also stock it.",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product id from search_products",
        },
        branchCode: {
          type: "string",
          description: "Store code from search_stores",
        },
      },
      required: ["productId", "branchCode"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
];
