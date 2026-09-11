import { API_ERROR_CODES } from "@/lib/apiError";
import {
  CONTACT_EMAIL,
  SITE_NAME_EN,
  SITE_TAGLINE_EN,
  SOURCE_REPOSITORY,
} from "@/lib/site";

export const OPENAPI_VERSION = "3.1.0";
export const API_VERSION = "1.0.0";

type JsonObject = Record<string, unknown>;

function queryParam(
  name: string,
  description: string,
  schema: JsonObject,
  required = false,
): JsonObject {
  return {
    name,
    in: "query",
    required,
    description,
    schema,
  };
}

/**
 * 공개 REST API 의 OpenAPI 문서. `/openapi.json`, `/openapi.yaml`,
 * `/api/openapi.json`, `/api/openapi.yaml` 이 모두 이 함수를 사용한다.
 */
export function buildOpenApiDocument(baseUrl: string): JsonObject {
  const base = baseUrl.replace(/\/$/, "");

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: `${SITE_NAME_EN} API`,
      version: API_VERSION,
      summary: SITE_TAGLINE_EN,
      description: [
        `${SITE_NAME_EN} (다이소 파인더) is a free, keyless public API for finding Daiso stores in South Korea`,
        "and checking product stock, price, and shelf placement inside a specific store.",
        "",
        "## When to use",
        "",
        "- A user asks where to buy an item at Daiso, or whether a Daiso store has it in stock right now.",
        "- A user needs a Daiso store's address, opening hours, coordinates, or store code.",
        "- A user asks on which floor or zone of a Daiso store an item is shelved.",
        "",
        "## Authentication",
        "",
        "None. Every endpoint is anonymous, free, and self-serve — no API key, token, or sign-up.",
        "",
        "## Calling order",
        "",
        "1. `searchStores` (or `searchNearbyStores`) to obtain a store `code`.",
        "2. `searchStoreProducts` with that `code` as `branchCode` to list in-stock products.",
        "3. `getProductAvailability` for one product's stock, shelf placement, and nearby stores that stock it.",
        "",
        "## Sandbox",
        "",
        "`/api/sandbox/*` mirrors the production endpoints with fixed fixture data and never calls the",
        "upstream Daiso service. Use it to verify an integration without generating live traffic.",
        "",
        "## Rate limits",
        "",
        "No hard quota is enforced. Requests are proxied to the upstream Daiso service, so keep concurrency",
        "modest (a few requests per second) and cache store metadata, which changes rarely.",
      ].join("\n"),
      contact: {
        name: `${SITE_NAME_EN} support`,
        email: CONTACT_EMAIL,
        url: `${base}/contact`,
      },
      license: { name: "MIT", identifier: "MIT" },
      termsOfService: `${base}/privacy`,
      "x-repository": SOURCE_REPOSITORY,
    },
    servers: [{ url: base, description: "Production and fixture endpoints" }],
    externalDocs: {
      description: `${SITE_NAME_EN} developer portal`,
      url: `${base}/developers`,
    },
    security: [],
    tags: [
      {
        name: "stores",
        description: "Daiso store lookup by keyword or GPS coordinates.",
      },
      {
        name: "products",
        description: "In-store product stock, price, and shelf placement.",
      },
      {
        name: "meta",
        description: "Service discovery documents for agents.",
      },
    ],
    paths: {
      "/api": {
        get: {
          operationId: "getApiIndex",
          tags: ["meta"],
          summary: "List API entry points",
          description:
            "Returns a machine-readable index of every public endpoint and discovery document, so an agent can bootstrap from a single request.",
          responses: {
            "200": {
              description: "API index",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiIndex" },
                },
              },
            },
          },
        },
      },
      "/api/branches/search": {
        get: {
          operationId: "searchStores",
          tags: ["stores"],
          summary: "Search Daiso stores by keyword or coordinates",
          description:
            "Searches Daiso stores in South Korea. Provide `keyword` for an address or store-name search, or both `curLttd` and `curLitd` for a nearest-first search around a GPS position. Returns at most `pageSize` stores; a full page means more results may exist on the next `currentPage`.",
          parameters: [
            queryParam(
              "keyword",
              "Address, neighborhood, or store name. Required unless coordinates are supplied.",
              {
                type: "string",
                examples: ["강남", "다이소 명동"],
              },
            ),
            queryParam(
              "curLttd",
              "Latitude in decimal degrees, for a nearby search.",
              {
                type: "number",
                format: "double",
                minimum: -90,
                maximum: 90,
                examples: [37.497175],
              },
            ),
            queryParam(
              "curLitd",
              "Longitude in decimal degrees, for a nearby search.",
              {
                type: "number",
                format: "double",
                minimum: -180,
                maximum: 180,
                examples: [127.027926],
              },
            ),
            queryParam("currentPage", "1-based page number.", {
              type: "integer",
              minimum: 1,
              default: 1,
            }),
            queryParam("pageSize", "Stores per page.", {
              type: "integer",
              minimum: 1,
              maximum: 10,
              default: 10,
            }),
          ],
          responses: {
            "200": {
              description:
                "Matching stores, nearest first for coordinate searches.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Store" },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "502": { $ref: "#/components/responses/UpstreamError" },
          },
        },
      },
      "/api/branches/{code}": {
        get: {
          operationId: "getStore",
          tags: ["stores"],
          summary: "Get one Daiso store by store code",
          description:
            "Returns address, coordinates, and opening hours for a single store. `code` is the `code` field returned by `searchStores`.",
          parameters: [
            {
              name: "code",
              in: "path",
              required: true,
              description: "Daiso store code, as returned by `searchStores`.",
              schema: { type: "string", examples: ["11199"] },
            },
          ],
          responses: {
            "200": {
              description: "Store details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Store" },
                },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
            "502": { $ref: "#/components/responses/UpstreamError" },
          },
        },
      },
      "/api/products": {
        get: {
          operationId: "searchStoreProducts",
          tags: ["products"],
          summary: "Search in-stock products inside one store",
          description:
            "Searches the Daiso catalogue for `keyword`, keeps only products that are currently in stock at `branchCode`, and enriches each one with its shelf placement (floor and zone). Set `stream=1` to receive NDJSON progress events instead of a single JSON body, because a page can take several seconds to assemble.",
          parameters: [
            queryParam(
              "branchCode",
              "Store code from `searchStores`. `branchCd` is accepted as a legacy alias.",
              { type: "string", examples: ["11199"] },
              true,
            ),
            queryParam(
              "keyword",
              "Product name to search for.",
              {
                type: "string",
                examples: ["수세미"],
              },
              true,
            ),
            queryParam(
              "currentPage",
              "1-based page number of the catalogue scan.",
              {
                type: "integer",
                minimum: 1,
                default: 1,
              },
            ),
            queryParam(
              "stream",
              "Set to `1` to stream NDJSON progress events. Equivalent to sending `Accept: application/x-ndjson`.",
              { type: "string", enum: ["1"] },
            ),
          ],
          responses: {
            "200": {
              description:
                "In-stock products for the store. NDJSON when streaming was requested.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductSearchResult" },
                },
                "application/x-ndjson": {
                  schema: { $ref: "#/components/schemas/ProductStreamEvent" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/products/{id}": {
        get: {
          operationId: "getProductAvailability",
          tags: ["products"],
          summary: "Get one product's stock and shelf placement",
          description:
            "Returns the stock count and shelf placement of one product at `branchCode`, plus nearby stores that also have it in stock.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description:
                "Daiso product number, as returned by `searchStoreProducts`.",
              schema: { type: "string", examples: ["1019373"] },
            },
            queryParam(
              "branchCode",
              "Store code from `searchStores`. `branchCd` is accepted as a legacy alias.",
              { type: "string", examples: ["11199"] },
              true,
            ),
          ],
          responses: {
            "200": {
              description: "Product availability",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductAvailability" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/api/sandbox/branches/search": {
        get: {
          operationId: "searchSandboxStores",
          tags: ["stores"],
          summary: "Sandbox copy of searchStores",
          description:
            "Same request and response shape as `searchStores`, answered from fixed fixture data without contacting the upstream Daiso service.",
          parameters: [
            queryParam(
              "keyword",
              "Any keyword. Fixture stores are filtered by substring match.",
              {
                type: "string",
              },
            ),
            queryParam(
              "curLttd",
              "Latitude. Accepted and ignored by the fixture.",
              {
                type: "number",
                format: "double",
              },
            ),
            queryParam(
              "curLitd",
              "Longitude. Accepted and ignored by the fixture.",
              {
                type: "number",
                format: "double",
              },
            ),
          ],
          responses: {
            "200": {
              description: "Fixture stores",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Store" },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/sandbox/branches/{code}": {
        get: {
          operationId: "getSandboxStore",
          tags: ["stores"],
          summary: "Sandbox copy of getStore",
          description:
            "Returns a fixture store. Use `11199` for a hit and any other code for the 404 error shape.",
          parameters: [
            {
              name: "code",
              in: "path",
              required: true,
              description: "Fixture store code.",
              schema: { type: "string", examples: ["11199"] },
            },
          ],
          responses: {
            "200": {
              description: "Fixture store",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Store" },
                },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/sandbox/products": {
        get: {
          operationId: "searchSandboxStoreProducts",
          tags: ["products"],
          summary: "Sandbox copy of searchStoreProducts",
          description:
            "Same response shape as `searchStoreProducts`, answered from fixture data. Requires `branchCode` and `keyword` so that the error shapes match production.",
          parameters: [
            queryParam(
              "branchCode",
              "Fixture store code.",
              { type: "string" },
              true,
            ),
            queryParam(
              "keyword",
              "Any keyword. Fixture products are filtered by substring match.",
              {
                type: "string",
              },
              true,
            ),
          ],
          responses: {
            "200": {
              description: "Fixture products",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductSearchResult" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/sandbox/products/{id}": {
        get: {
          operationId: "getSandboxProductAvailability",
          tags: ["products"],
          summary: "Sandbox copy of getProductAvailability",
          description:
            "Returns fixed stock, shelf placement, and nearby-store data for a fixture product without contacting the upstream Daiso service.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Fixture product id.",
              schema: { type: "string", examples: ["1019373"] },
            },
            queryParam(
              "branchCode",
              "Fixture store code.",
              { type: "string", examples: ["11199"] },
              true,
            ),
          ],
          responses: {
            "200": {
              description: "Fixture product availability",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductAvailability" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/mcp": {
        get: {
          operationId: "getMcpServerInfo",
          tags: ["meta"],
          summary: "MCP server metadata",
          description:
            "Returns Model Context Protocol server metadata and the tool list. With `Accept: text/event-stream` it opens the Streamable HTTP server-to-client SSE stream instead.",
          responses: {
            "200": {
              description: "MCP server metadata",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/McpServerInfo" },
                },
                "text/event-stream": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
        post: {
          operationId: "callMcp",
          tags: ["meta"],
          summary: "MCP JSON-RPC endpoint (Streamable HTTP)",
          description:
            "Model Context Protocol endpoint speaking JSON-RPC 2.0 over Streamable HTTP. Supports `initialize`, `tools/list`, and `tools/call`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/JsonRpcRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "JSON-RPC response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/JsonRpcResponse" },
                },
                "text/event-stream": { schema: { type: "string" } },
              },
            },
            "202": { description: "Notification accepted; no response body." },
            "400": {
              description: "Malformed JSON-RPC request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/JsonRpcResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {},
      schemas: {
        Store: {
          type: "object",
          title: "Store",
          description: "One Daiso store.",
          required: [
            "code",
            "name",
            "lat",
            "lng",
            "address",
            "openTime",
            "closeTime",
          ],
          properties: {
            code: {
              type: "string",
              description:
                "Store code. Pass this as `branchCode` to the product endpoints.",
              examples: ["11199"],
            },
            name: {
              type: "string",
              description: "Store name.",
              examples: ["강남역점"],
            },
            lat: { type: "number", format: "double", description: "Latitude." },
            lng: {
              type: "number",
              format: "double",
              description: "Longitude.",
            },
            address: {
              type: "string",
              description: "Street address in Korean.",
              examples: ["서울특별시 강남구 강남대로 422 (역삼동)"],
            },
            openTime: {
              type: "string",
              description: "Opening time, HH:MM.",
              examples: ["10:00"],
            },
            closeTime: {
              type: "string",
              description: "Closing time, HH:MM.",
              examples: ["22:00"],
            },
          },
        },
        Product: {
          type: "object",
          title: "Product",
          description: "A product that is in stock at the requested store.",
          required: [
            "id",
            "name",
            "price",
            "image",
            "stock",
            "stairNo",
            "zoneNo",
          ],
          properties: {
            id: { type: "string", description: "Daiso product number." },
            name: { type: "string", description: "Product name in Korean." },
            price: { type: "integer", description: "Price in KRW." },
            image: {
              type: ["string", "null"],
              format: "uri",
              description:
                "Product image URL, or null when the catalogue has no image.",
            },
            stock: {
              type: "integer",
              minimum: 1,
              description: "Units in stock at the requested store.",
            },
            stairNo: {
              type: "integer",
              description: "Floor number inside the store.",
            },
            zoneNo: {
              type: "integer",
              description: "Zone number on that floor.",
            },
          },
        },
        ProductSearchResult: {
          type: "object",
          title: "ProductSearchResult",
          required: ["products", "hasMore", "nextPage"],
          properties: {
            products: {
              type: "array",
              description: "In-stock products, in catalogue relevance order.",
              items: { $ref: "#/components/schemas/Product" },
            },
            hasMore: {
              type: "boolean",
              description: "Whether more catalogue pages remain to scan.",
            },
            nextPage: {
              type: "integer",
              description: "Value to pass as `currentPage` for the next page.",
            },
          },
        },
        ProductStreamEvent: {
          title: "ProductStreamEvent",
          description:
            "One NDJSON line emitted while `stream=1`. Progress events repeat; exactly one `result` or `error` event ends the stream.",
          oneOf: [
            {
              type: "object",
              title: "ProgressEvent",
              required: [
                "type",
                "found",
                "target",
                "percent",
                "page",
                "scanned",
              ],
              properties: {
                type: { const: "progress" },
                found: {
                  type: "integer",
                  description: "In-stock products confirmed so far.",
                },
                target: {
                  type: "integer",
                  description: "Products wanted for this page.",
                },
                percent: { type: "integer", minimum: 0, maximum: 100 },
                page: {
                  type: "integer",
                  description: "Catalogue page being scanned.",
                },
                scanned: {
                  type: "integer",
                  description: "Catalogue entries inspected so far.",
                },
              },
            },
            {
              type: "object",
              title: "ResultEvent",
              required: ["type", "products", "hasMore", "nextPage"],
              properties: {
                type: { const: "result" },
                products: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
                hasMore: { type: "boolean" },
                nextPage: { type: "integer" },
              },
            },
            {
              type: "object",
              title: "StreamErrorEvent",
              required: ["type", "error"],
              properties: {
                type: { const: "error" },
                error: { type: "string" },
                detail: { type: "string" },
              },
            },
          ],
        },
        ProductAvailability: {
          type: "object",
          title: "ProductAvailability",
          required: ["stock", "stairNo", "zoneNo", "otherBranches"],
          properties: {
            stock: {
              type: "integer",
              description:
                "Units in stock at the requested store. 0 means out of stock.",
            },
            stairNo: {
              type: ["integer", "null"],
              description: "Floor number, or null when placement is unknown.",
            },
            zoneNo: {
              type: ["integer", "null"],
              description: "Zone number, or null when placement is unknown.",
            },
            otherBranches: {
              type: "array",
              description: "Nearby stores that also have the product in stock.",
              items: { $ref: "#/components/schemas/NearbyStoreStock" },
            },
          },
        },
        NearbyStoreStock: {
          type: "object",
          title: "NearbyStoreStock",
          required: ["code", "name", "address", "stock", "distanceKm"],
          properties: {
            code: { type: "string", description: "Store code." },
            name: { type: "string", description: "Store name." },
            address: {
              type: "string",
              description: "Street address in Korean.",
            },
            stock: {
              type: "integer",
              minimum: 1,
              description: "Units in stock.",
            },
            distanceKm: {
              type: ["number", "null"],
              description: "Distance from the requested store in kilometres.",
            },
          },
        },
        ApiIndex: {
          type: "object",
          title: "ApiIndex",
          required: [
            "name",
            "description",
            "authentication",
            "endpoints",
            "documentation",
          ],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            version: { type: "string" },
            authentication: {
              type: "object",
              required: ["type", "required"],
              properties: {
                type: { type: "string", examples: ["none"] },
                required: { type: "boolean" },
                signup: { type: "string" },
              },
            },
            endpoints: {
              type: "array",
              items: {
                type: "object",
                required: ["method", "path", "operationId", "description"],
                properties: {
                  method: { type: "string" },
                  path: { type: "string" },
                  operationId: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
            documentation: {
              type: "object",
              additionalProperties: { type: "string", format: "uri" },
            },
          },
        },
        McpServerInfo: {
          type: "object",
          title: "McpServerInfo",
          required: ["serverInfo", "endpoint", "tools"],
          properties: {
            serverInfo: {
              type: "object",
              required: ["name", "version"],
              properties: {
                name: { type: "string" },
                version: { type: "string" },
                description: { type: "string" },
              },
            },
            endpoint: { type: "string", format: "uri" },
            transport: { type: "string", examples: ["streamable-http"] },
            protocolVersion: { type: "string" },
            capabilities: { type: "object", additionalProperties: true },
            tools: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        JsonRpcRequest: {
          type: "object",
          title: "JsonRpcRequest",
          required: ["jsonrpc", "method"],
          properties: {
            jsonrpc: { const: "2.0" },
            method: {
              type: "string",
              examples: ["initialize", "tools/list", "tools/call"],
            },
            params: { type: "object", additionalProperties: true },
            id: { type: ["string", "number", "null"] },
          },
        },
        JsonRpcResponse: {
          type: "object",
          title: "JsonRpcResponse",
          required: ["jsonrpc"],
          properties: {
            jsonrpc: { const: "2.0" },
            result: { type: "object", additionalProperties: true },
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "integer" },
                message: { type: "string" },
                data: { additionalProperties: true },
              },
            },
            id: { type: ["string", "number", "null"] },
          },
        },
        Error: {
          type: "object",
          title: "Error",
          description: "Every non-2xx response from this API uses this shape.",
          required: [
            "error",
            "code",
            "message",
            "hint",
            "status",
            "documentation",
          ],
          properties: {
            error: {
              type: "string",
              description:
                "Human-readable message in Korean, for display to end users.",
            },
            code: {
              type: "string",
              description: "Stable machine-readable error code.",
              enum: [...API_ERROR_CODES],
            },
            message: {
              type: "string",
              description:
                "Human-readable message in English, for agents and logs.",
            },
            hint: {
              type: "string",
              description:
                "What to change in order to make the request succeed.",
            },
            status: {
              type: "integer",
              description: "HTTP status code, repeated in the body.",
            },
            documentation: {
              type: "string",
              format: "uri",
              description: "Developer documentation URL.",
            },
            detail: {
              type: "string",
              description:
                "Optional upstream or exception detail, for debugging.",
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "A required parameter is missing or malformed.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description: "No such store, product, or route.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        UpstreamError: {
          description:
            "The upstream Daiso service failed or rejected the request.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        InternalError: {
          description: "Unexpected server error.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  };
}
