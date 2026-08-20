/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/fixtures/ by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/fixtures/ (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

/**
 * The golden fixtures.
 *
 * Deterministic on purpose: the same seed produces the same bytes in
 * TypeScript, PHP and Python, so this file and its twins in the other packages
 * assert the SAME values. That turns the faker into a parity test rather than
 * a convenience — which matters, because cross-runtime drift does not fail
 * loudly. It completes, down one path, with no error.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeRequest } from "@particle-academy/fancy-connector-core";

import { stripeFaker } from "../src/faker.js";

test("customer_create fakes the shape Stripe publishes", () => {
  const config = {};

  const faked = stripeFaker("customer_create", fakeRequest("stripe", "customer_create", config));

  assert.deepEqual(faked, {
    "id": "cus_fake_17ed1b8c2704",
    "object": "customer",
    "email": "ada@example.test",
    "name": null,
    "created": 1767225600,
    "livemode": false
  });
});

test("payment_intent_create fakes the shape Stripe publishes", () => {
  const config = {
    "currency": "usd"
  };

  const faked = stripeFaker("payment_intent_create", fakeRequest("stripe", "payment_intent_create", config));

  assert.deepEqual(faked, {
    "id": "pi_fake_303f74a80be9",
    "object": "payment_intent",
    "amount": 19569,
    "amount_received": 19569,
    "currency": "usd",
    "customer": null,
    "description": null,
    "status": "succeeded",
    "livemode": false,
    "created": 1767225600,
    "latest_charge": "ch_fake_00cc67960be2",
    "receipt_email": null
  });
});

test("refund_create fakes the shape Stripe publishes", () => {
  const config = {};

  const faked = stripeFaker("refund_create", fakeRequest("stripe", "refund_create", config));

  assert.deepEqual(faked, {
    "id": "re_fake_f64f4068d60b",
    "object": "refund",
    "amount": 14142,
    "currency": "usd",
    "payment_intent": "pi_fake_e67c4c2090f7",
    "reason": null,
    "status": "succeeded",
    "created": 1767225600
  });
});

test("webhook fakes the shape Stripe publishes", () => {
  const config = {
    "sample": "payment_intent.succeeded"
  };

  const faked = stripeFaker("webhook", fakeRequest("stripe", "webhook", config));

  assert.deepEqual(faked, {
    "id": "evt_fake_80bf44d16c8f",
    "object": "event",
    "type": "payment_intent.succeeded",
    "api_version": "2026-01-01",
    "created": 1767225600,
    "livemode": false,
    "data": {
      "object": {
        "id": "pi_fake_4f2fc32a5e11",
        "object": "payment_intent",
        "amount": 2500,
        "amount_received": 2500,
        "currency": "usd",
        "status": "succeeded"
      }
    }
  });
});

test("an operation with no fixture throws rather than inventing a shape", () => {
  assert.throws(() => stripeFaker("no_such_operation", fakeRequest("stripe", "no_such_operation", {})), /no fake response/);
});
