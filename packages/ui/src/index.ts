/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/manifest.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/manifest.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

/**
 * Stripe's node kinds for fancy-flow.
 *
 * Install this on every host. The TypeScript executors live in the js
 * package's `./flow` subpath; PHP and Python hosts run their own and need only
 * this.
 */

export * from "./connector.js";
export * from "./service.js";
export * from "./kinds/customer-create.js";
export * from "./kinds/payment-intent-create.js";
export * from "./kinds/refund-create.js";
export * from "./kinds/webhook.js";

import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { stripeCustomerKind } from "./kinds/customer-create.js";
import { stripePaymentIntentKind } from "./kinds/payment-intent-create.js";
import { stripeRefundKind } from "./kinds/refund-create.js";
import { stripeWebhookTriggerKind } from "./kinds/webhook.js";

/** Every Stripe kind, for a host that registers the lot. */
export const STRIPE_KINDS: NodeKindDefinition[] = [
  stripeCustomerKind,
  stripePaymentIntentKind,
  stripeRefundKind,
  stripeWebhookTriggerKind,
];
