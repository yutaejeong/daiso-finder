import assert from "node:assert/strict";
import { test } from "node:test";
import { appendVary } from "@/lib/vary";

test("adds Accept and Accept-Encoding when Vary is unset", () => {
  assert.equal(appendVary(null), "Accept, Accept-Encoding");
  assert.equal(appendVary(undefined), "Accept, Accept-Encoding");
  assert.equal(appendVary(""), "Accept, Accept-Encoding");
});

test("keeps the RSC values Next.js relies on", () => {
  assert.equal(
    appendVary("RSC, Next-Router-State-Tree, Next-Router-Prefetch"),
    "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept, Accept-Encoding",
  );
});

test("does not duplicate values that are already present", () => {
  assert.equal(
    appendVary("accept, accept-encoding"),
    "accept, accept-encoding",
  );
  assert.equal(appendVary("Accept-Encoding"), "Accept-Encoding, Accept");
});
