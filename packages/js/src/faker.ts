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
 * The Stripe faker.
 *
 * Shapes, not behaviour: the goal is that a downstream node sees the field
 * NAMES Stripe actually publishes, so an author can wire {{ $json.data.id }}
 * against a fake and have it keep working against the real thing.
 *
 * Deterministic — same inputs, same output. A faker returning a fresh uuid
 * every call cannot be asserted on, so its fixtures degrade to "it did not
 * throw", which is the assertion that catches nothing.
 */

import type { ConnectorFaker, FakeRequest } from "@particle-academy/fancy-connector-core";

function fakeCustomerCreate({ config, fake }: FakeRequest): unknown {
  return {
    "id": fake.id("cus"),
    "object": "customer",
    "email": (config.email !== undefined && config.email !== null && config.email !== "" ? String(config.email) : "ada@example.test"),
    "name": (config.name !== undefined && config.name !== null && config.name !== "" ? String(config.name) : null),
    "created": 1767225600,
    "livemode": false,
  };
}

function fakePaymentIntentCreate({ config, fake }: FakeRequest): unknown {
  const out: Record<string, unknown> = {};
  out["id"] = fake.id("pi");
  out["object"] = "payment_intent";
  out["amount"] = (config.amount !== undefined && config.amount !== null && config.amount !== "" ? Math.trunc(Number(config.amount)) : fake.int(500, 25000));
  out["amount_received"] = out["amount"];
  out["currency"] = (config.currency !== undefined && config.currency !== null && config.currency !== "" ? String(config.currency) : "usd");
  out["customer"] = (config.customer !== undefined && config.customer !== null && config.customer !== "" ? String(config.customer) : null);
  out["description"] = (config.description !== undefined && config.description !== null && config.description !== "" ? String(config.description) : null);
  out["status"] = "succeeded";
  out["livemode"] = false;
  out["created"] = 1767225600;
  out["latest_charge"] = fake.id("ch");
  out["receipt_email"] = (config.receiptEmail !== undefined && config.receiptEmail !== null && config.receiptEmail !== "" ? String(config.receiptEmail) : null);

  return out;
}

function fakeRefundCreate({ config, fake }: FakeRequest): unknown {
  return {
    "id": fake.id("re"),
    "object": "refund",
    "amount": (config.amount !== undefined && config.amount !== null && config.amount !== "" ? Math.trunc(Number(config.amount)) : fake.int(500, 25000)),
    "currency": "usd",
    "payment_intent": (config.paymentIntent !== undefined && config.paymentIntent !== null && config.paymentIntent !== "" ? String(config.paymentIntent) : fake.id("pi")),
    "reason": (config.reason !== undefined && config.reason !== null && config.reason !== "" ? String(config.reason) : null),
    "status": "succeeded",
    "created": 1767225600,
  };
}

function fakeWebhook({ config, fake }: FakeRequest): unknown {
  const variants: Record<string, () => unknown> = {
    "payment_intent.succeeded": () => ({
        "id": fake.id("pi"),
        "object": "payment_intent",
        "amount": 2500,
        "amount_received": 2500,
        "currency": "usd",
        "status": "succeeded",
      }),
    "charge.refunded": () => ({
        "id": fake.id("ch"),
        "object": "charge",
        "amount": 2500,
        "amount_refunded": 2500,
        "currency": "usd",
        "status": "succeeded",
        "refunded": true,
      }),
    "checkout.session.completed": () => ({
        "id": fake.id("cs"),
        "object": "checkout.session",
        "amount_total": 2500,
        "currency": "usd",
        "status": "complete",
        "payment_status": "paid",
        "customer_email": "ada@example.test",
      }),
    "customer.subscription.deleted": () => ({
        "id": fake.id("sub"),
        "object": "subscription",
        "status": "canceled",
        "customer": fake.id("cus"),
        "canceled_at": 1767225600,
      }),
  };

  const selected = String(config.sample ?? "payment_intent.succeeded");
  const variant = (variants[selected] ?? variants["payment_intent.succeeded"] as () => unknown)();

  return {
    "id": fake.id("evt"),
    "object": "event",
    "type": (config.sample !== undefined && config.sample !== null && config.sample !== "" ? String(config.sample) : "payment_intent.succeeded"),
    "api_version": "2026-01-01",
    "created": 1767225600,
    "livemode": false,
    "data": {
      "object": variant,
    },
  };
}

export const stripeFaker: ConnectorFaker = (operation, request) => {
  switch (operation) {
    case "customer_create":
      return fakeCustomerCreate(request);

    case "payment_intent_create":
      return fakePaymentIntentCreate(request);

    case "refund_create":
      return fakeRefundCreate(request);

    case "webhook":
      return fakeWebhook(request);

    default:
      // A faker asked for an operation it has no shape for must SAY so. Making
      // something up would produce a green run whose output silently has none
      // of the fields the author is about to reference.
      throw new Error(
        `stripe: no fake response is defined for "${operation}". ` +
          "Add a fixture under provider/fixtures/ and regenerate — a connector without a faker " +
          "cannot be developed against, tested, or demonstrated.",
      );
  }
};
