/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/ + triggers/ by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/ + triggers/ (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { STRIPE_KINDS } from "../src/index.js";

test("every kind carries the two connector fields, in the same order, with the same keys", () => {
  // Uniformity is the feature. An agent that has configured one connector has configured all of them.
  for (const kind of STRIPE_KINDS) {
    const keys = (kind.configSchema ?? []).map((field) => field.key);
    assert.equal(keys[0], "connection", `${kind.name} does not lead with the connection field`);
    assert.equal(keys[1], "mode", `${kind.name} does not follow with the mode field`);
    assert.equal(new Set(keys).size, keys.length, `${kind.name} has a duplicate config key`);
  }
});

test("every kind declares what it emits", () => {
  // An undeclared shape means an author types a path into the next node and hopes; a wrong path resolves to null at run time and the run stays green.
  for (const kind of STRIPE_KINDS) {
    assert.ok((kind.outputShape ?? []).length > 0, `${kind.name} declares no outputShape`);
  }
});

test("the registry names are exactly what the manifest says", () => {
  assert.deepEqual(STRIPE_KINDS.map((kind) => kind.name), [
    "@particle-academy/stripe_customer",
    "@particle-academy/stripe_payment_intent",
    "@particle-academy/stripe_refund",
    "@particle-academy/stripe_webhook_trigger"
  ]);
});

test("a trigger takes no input port — it starts a run rather than continuing one", () => {
  assert.deepEqual(STRIPE_KINDS.find((k) => k.name.endsWith("_webhook_trigger"))?.inputs, []);
});
