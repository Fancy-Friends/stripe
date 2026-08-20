/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/ by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/ (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

/**
 * What Stripe actually receives.
 *
 * Every assertion below is about the request rather than the response, and
 * none of it touches the network: the transport is a stub that records what it
 * was handed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { PreparedRequest } from "@particle-academy/fancy-connector-core";

import { stripeCustomerCreate } from "../src/actions/customer-create.js";
import { stripePaymentIntentCreate } from "../src/actions/payment-intent-create.js";
import { stripeRefundCreate } from "../src/actions/refund-create.js";

/** Capture the prepared request instead of sending it. */
function capture() {
  const seen: PreparedRequest[] = [];

  return {
    seen,
    transport: async (request: PreparedRequest) => {
      seen.push(request);

      return { status: 200, body: JSON.stringify({ id: "captured" }), headers: {} };
    },
  };
}

const CREDENTIALS = {
  "secretKey": "test_secretKey",
  "webhookSecret": "test_webhookSecret"
};

test("customer_create sends POST /v1/customers", async () => {
  const { seen, transport } = capture();

  await stripeCustomerCreate({
    config: {
      "email": "  Example-email  ",
      "name": "example-name",
      "phone": "example-phone",
      "metadata": {
        "order_id": "7"
      }
    },
    credentials: CREDENTIALS,
    mode: "live",
    transport,
  });

  assert.equal(seen.length, 1);
  assert.equal(seen[0]!.method, "POST");
  assert.ok(new URL(seen[0]!.url).pathname.endsWith("/v1/customers"), seen[0]!.url);

  assert.deepEqual(
    Object.fromEntries(new URLSearchParams(String(seen[0]!.body ?? ""))),
    {
      "email": "Example-email",
      "name": "example-name",
      "phone": "example-phone",
      "metadata[order_id]": "7"
    },
  );
});

test("payment_intent_create sends POST /v1/payment_intents", async () => {
  const { seen, transport } = capture();

  await stripePaymentIntentCreate({
    config: {
      "amount": 1000,
      "currency": "EXAMPLE-CURRENCY",
      "customer": "example-customer",
      "description": "example-description",
      "receiptEmail": "example-receiptEmail",
      "metadata": {
        "order_id": "7"
      }
    },
    credentials: CREDENTIALS,
    mode: "live",
    transport,
  });

  assert.equal(seen.length, 1);
  assert.equal(seen[0]!.method, "POST");
  assert.ok(new URL(seen[0]!.url).pathname.endsWith("/v1/payment_intents"), seen[0]!.url);

  assert.deepEqual(
    Object.fromEntries(new URLSearchParams(String(seen[0]!.body ?? ""))),
    {
      "amount": "1000",
      "currency": "example-currency",
      "customer": "example-customer",
      "description": "example-description",
      "receipt_email": "example-receiptEmail",
      "metadata[order_id]": "7"
    },
  );
});

test("refund_create sends POST /v1/refunds", async () => {
  const { seen, transport } = capture();

  await stripeRefundCreate({
    config: {
      "paymentIntent": "example-paymentIntent",
      "amount": 1000,
      "reason": "duplicate",
      "metadata": {
        "order_id": "7"
      }
    },
    credentials: CREDENTIALS,
    mode: "live",
    transport,
  });

  assert.equal(seen.length, 1);
  assert.equal(seen[0]!.method, "POST");
  assert.ok(new URL(seen[0]!.url).pathname.endsWith("/v1/refunds"), seen[0]!.url);

  assert.deepEqual(
    Object.fromEntries(new URLSearchParams(String(seen[0]!.body ?? ""))),
    {
      "payment_intent": "example-paymentIntent",
      "amount": "1000",
      "reason": "duplicate",
      "metadata[order_id]": "7"
    },
  );
});

test("the credential is placed the way the provider wants it", async () => {
  const { seen, transport } = capture();

  await stripeCustomerCreate({
    config: {
      "email": "  Example-email  ",
      "name": "example-name",
      "phone": "example-phone",
      "metadata": {
        "order_id": "7"
      }
    },
    credentials: CREDENTIALS,
    mode: "live",
    transport,
  });

  assert.equal(seen[0]!.headers.Authorization, "Bearer test_secretKey");
});

/**
 * The idempotency key reaches the provider.
 *
 * This header is what makes `unsafe-to-replay` survivable rather than merely
 * declared: a retried durable run sends the SAME key, so the provider returns
 * the original result instead of creating a second one. A key the request
 * quietly drops shows up as a double charge.
 */
test("the Idempotency-Key header carries the key", async () => {
  const { seen, transport } = capture();

  await stripeCustomerCreate({
    config: {
      "email": "  Example-email  ",
      "name": "example-name",
      "phone": "example-phone",
      "metadata": {
        "order_id": "7"
      }
    },
    credentials: CREDENTIALS,
    mode: "live",
    idempotencyKey: "run-1:node-a",
    transport,
  });

  assert.equal(seen[0]!.headers["Idempotency-Key"], "run-1:node-a");
});

test("a missing required field is refused BEFORE anything is sent", async () => {
  // Nothing was attempted, so there is nothing to classify — and the message names
  // the field, rather than letting the provider answer three frames later with
  // "invalid request".
  const { seen, transport } = capture();

  await assert.rejects(
    stripeCustomerCreate({
      config: {
        "name": "example-name",
        "phone": "example-phone",
        "metadata": {
          "order_id": "7"
        }
      },
      credentials: CREDENTIALS,
      mode: "live",
      transport,
    }),
    new RegExp("email"),
  );

  assert.equal(seen.length, 0, "the request must not have been sent");
});
