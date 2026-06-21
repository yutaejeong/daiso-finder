const { defineConfig } = require("orval");

module.exports = defineConfig({
  daiso: {
    input: {
      target: "./openapi/daiso.filtered.json",
    },
    output: {
      target: "./src/generated/daiso/client.ts",
      schemas: "./src/generated/daiso/model",
      client: "fetch",
      clean: true,
      prettier: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: "./src/lib/daisoApiClient.ts",
          name: "daisoFetch",
        },
      },
    },
  },
});
