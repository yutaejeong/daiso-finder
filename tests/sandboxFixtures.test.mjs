import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterSandboxProducts,
  filterSandboxStores,
  findSandboxStore,
  SANDBOX_PRODUCTS,
  SANDBOX_STORES,
} from "@/lib/sandboxFixtures";

const STORE_FIELDS = [
  "code",
  "name",
  "lat",
  "lng",
  "address",
  "openTime",
  "closeTime",
];
const PRODUCT_FIELDS = [
  "id",
  "name",
  "price",
  "image",
  "stock",
  "stairNo",
  "zoneNo",
];

test("fixtures match the documented public response shape", () => {
  for (const store of SANDBOX_STORES) {
    assert.deepEqual(Object.keys(store).sort(), [...STORE_FIELDS].sort());
  }
  for (const product of SANDBOX_PRODUCTS) {
    assert.deepEqual(Object.keys(product).sort(), [...PRODUCT_FIELDS].sort());
    assert.ok(product.stock > 0, "sandbox products are always in stock");
  }
});

test("documented sandbox store codes exist", () => {
  for (const code of ["11199", "10528", "10962"]) {
    assert.ok(findSandboxStore(code), `missing fixture store ${code}`);
  }
  assert.equal(findSandboxStore("00000"), null);
});

test("store search filters by name or address", () => {
  const matches = filterSandboxStores("강남");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].code, "11199");
  assert.equal(filterSandboxStores("마포").length, 1);
});

test("an unmatched keyword still returns usable fixtures", () => {
  assert.deepEqual(filterSandboxStores("존재하지않는지점"), SANDBOX_STORES);
  assert.deepEqual(filterSandboxProducts("존재하지않는상품"), SANDBOX_PRODUCTS);
  assert.deepEqual(filterSandboxStores("   "), SANDBOX_STORES);
});

test("product search is case-insensitive", () => {
  const upper = filterSandboxProducts("MICROFIBER");
  assert.equal(upper.length, 1);
  assert.equal(upper[0].id, "1031244");
});
