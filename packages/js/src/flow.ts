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

/**
 * Stripe's node kinds with their TypeScript executors attached — for hosts
 * that EXECUTE on TS.
 *
 * The authoring surface in @particle-academy/stripe-ui carries no executor:
 * the editor is React on every host, so a PHP or Python project installs the
 * ui package and never this one.
 */

import type { NodeExecutor, NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import {
  idempotencyKeyFor,
  NO_IDEMPOTENCY_KEY_WARNING,
  resolveConnection,
  triggerEvent,
  type RequestedMode,
} from "@particle-academy/fancy-connector-core";
import { STRIPE } from "./service.js";

import {
  stripeCustomerKind,
  stripePaymentIntentKind,
  stripeRefundKind,
  stripeWebhookTriggerKind,
} from "@particle-academy/stripe-ui";

import { stripeCustomerCreate } from "./actions/customer-create.js";
import { stripePaymentIntentCreate } from "./actions/payment-intent-create.js";
import { stripeRefundCreate } from "./actions/refund-create.js";
import { STRIPE_WEBHOOK } from "./triggers/webhook.js";

export const stripeCustomerExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as { config?: Record<string, unknown> })?.config ?? {});

  // Derived from the RUN and the NODE, never fresh. A retried durable run
  // must send the same key or Stripe creates a second one — the exact
  // failure "unsafe-to-replay" exists to prevent.
  const idempotencyKey = idempotencyKeyFor(ctx, ctx.node.id, {
    context: { service: "stripe", operation: "customer_create" },
  });
  if (idempotencyKey === null) {
    ctx.emit({
      type: "log",
      level: "warn",
      nodeId: ctx.node.id,
      message: `customer_create: ${NO_IDEMPOTENCY_KEY_WARNING}`,
    });
  }

  const result = await stripeCustomerCreate({
    config,
    input: ctx.inputs?.in,
    ...(idempotencyKey === null ? {} : { idempotencyKey }),
  });

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `stripe customer_create ${(result.data as { id?: string })?.id} (${result.mode})`,
  });

  return { __port: "out", value: result };
};

export const stripePaymentIntentExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as { config?: Record<string, unknown> })?.config ?? {});

  // Derived from the RUN and the NODE, never fresh. A retried durable run
  // must send the same key or Stripe creates a second one — the exact
  // failure "unsafe-to-replay" exists to prevent.
  const idempotencyKey = idempotencyKeyFor(ctx, ctx.node.id, {
    context: { service: "stripe", operation: "payment_intent_create" },
  });
  if (idempotencyKey === null) {
    ctx.emit({
      type: "log",
      level: "warn",
      nodeId: ctx.node.id,
      message: `payment_intent_create: ${NO_IDEMPOTENCY_KEY_WARNING}`,
    });
  }

  const result = await stripePaymentIntentCreate({
    config,
    input: ctx.inputs?.in,
    ...(idempotencyKey === null ? {} : { idempotencyKey }),
  });

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `stripe payment_intent_create ${(result.data as { id?: string })?.id} (${result.mode})`,
  });

  return { __port: "out", value: result };
};

export const stripeRefundExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as { config?: Record<string, unknown> })?.config ?? {});

  // Derived from the RUN and the NODE, never fresh. A retried durable run
  // must send the same key or Stripe creates a second one — the exact
  // failure "unsafe-to-replay" exists to prevent.
  const idempotencyKey = idempotencyKeyFor(ctx, ctx.node.id, {
    context: { service: "stripe", operation: "refund_create" },
  });
  if (idempotencyKey === null) {
    ctx.emit({
      type: "log",
      level: "warn",
      nodeId: ctx.node.id,
      message: `refund_create: ${NO_IDEMPOTENCY_KEY_WARNING}`,
    });
  }

  const result = await stripeRefundCreate({
    config,
    input: ctx.inputs?.in,
    ...(idempotencyKey === null ? {} : { idempotencyKey }),
  });

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `stripe refund_create ${(result.data as { id?: string })?.id} (${result.mode})`,
  });

  return { __port: "out", value: result };
};

export const stripeWebhookTriggerExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as { config?: Record<string, unknown> })?.config ?? {});
  const connection = resolveConnection({
    service: STRIPE.service,
    operation: "webhook",
    sandbox: STRIPE.sandbox,
    baseUrls: STRIPE.baseUrls,
    requires: STRIPE.requires,
    connectionId: typeof config.connection === "string" ? config.connection : null,
    requested: typeof config.mode === "string" ? (config.mode as RequestedMode) : null,
  });

  const event = triggerEvent(STRIPE_WEBHOOK, connection, ctx.inputs?.in, config);

  return { __port: "out", value: event };
};

/** The kinds a TypeScript host registers. */
export const STRIPE_RUNNABLE_KINDS: NodeKindDefinition[] = [
  { ...stripeCustomerKind, executor: stripeCustomerExecutor },
  { ...stripePaymentIntentKind, executor: stripePaymentIntentExecutor },
  { ...stripeRefundKind, executor: stripeRefundExecutor },
  { ...stripeWebhookTriggerKind, executor: stripeWebhookTriggerExecutor },
];
