/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/refund-create.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/refund-create.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

/**
 * Stripe refund — Refund a Stripe payment, in full or in part.
 *
 * https://docs.stripe.com/api/refunds/create
 *
 * `unsafe-to-replay`, and the idempotency key is why that is survivable rather
 * than merely declared: a durable run that retries this node sends the same
 * `Idempotency-Key`, so Stripe returns the original result instead of creating
 * a second one.
 */

import type { NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

import { defineConnectorKind, summarize } from "../connector.js";
import { stripeMeta } from "../service.js";

export const STRIPE_REFUND_KIND = "@particle-academy/stripe_refund";
export const STRIPE_REFUND_OPERATION = "refund_create";

export const STRIPE_REFUND_META = stripeMeta("action", "refund a payment", "https://docs.stripe.com/api/refunds/create");

/**
 * What this node emits — the "ingredients" a downstream node can reference.
 *
 * fancy-flow reads `outputShape` off the kind and offers it in the variable
 * picker, so declaring it is the whole of the work: an author configuring the
 * next node picks `{{ $json.data.id }}` off a list instead of typing a path
 * and hoping.
 */
export const STRIPE_REFUND_OUTPUT: OutputField[] = [
  {
    "path": "mode",
    "type": "string",
    "description": "Which estate this ran against: fake, sandbox or live."
  },
  {
    "path": "connection",
    "type": "string",
    "description": "The connection id that was used."
  },
  {
    "path": "data.id",
    "type": "string",
    "description": "Refund id (re_…)."
  },
  {
    "path": "data.status",
    "type": "string",
    "description": "succeeded, pending, failed, canceled."
  },
  {
    "path": "data.amount",
    "type": "number",
    "description": "Amount refunded, in the currency's smallest unit."
  },
  {
    "path": "data.currency",
    "type": "string",
    "description": "Three-letter ISO currency code."
  },
  {
    "path": "data.payment_intent",
    "type": "string",
    "description": "The payment this refunded."
  },
  {
    "path": "data.reason",
    "type": "string",
    "description": "The stated reason, when one was given."
  }
];

export const stripeRefundKind: NodeKindDefinition = defineConnectorKind(STRIPE_REFUND_META, {
  name: STRIPE_REFUND_KIND,
  aliases: ["stripe_refund"],
  label: "Stripe refund",
  description: "Refund a Stripe payment, in full or in part.",
  icon: "◇",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  sideEffects: "unsafe-to-replay",
  outputShape: STRIPE_REFUND_OUTPUT,
  configSchema: [
    {
      "type": "expression",
      "key": "paymentIntent",
      "label": "Payment intent",
      "example": "{{ $json.data.id }}",
      "description": "The pi_… to refund. Usually carried forward from a Stripe payment node.",
      "required": true
    },
    {
      "type": "expression",
      "key": "amount",
      "label": "Amount",
      "example": "{{ $json.data.amount }}",
      "description": "In the currency's smallest unit. Leave empty to refund the whole payment."
    },
    {
      "type": "select",
      "key": "reason",
      "label": "Reason",
      "options": [
        {
          "value": "",
          "label": "Not stated"
        },
        {
          "value": "duplicate",
          "label": "Duplicate"
        },
        {
          "value": "fraudulent",
          "label": "Fraudulent"
        },
        {
          "value": "requested_by_customer",
          "label": "Requested by customer"
        }
      ],
      "description": "Stripe accepts only these three values. Anything else is rejected at the API."
    },
    {
      "type": "keyvalue",
      "key": "metadata",
      "label": "Metadata",
      "keyPlaceholder": "refund_of",
      "valuePlaceholder": "{{ $json.order_id }}"
    }
  ],
  defaultConfig: {
    "mode": "auto"
  },
  renderBody: ({ config }) =>
    summarize(STRIPE_REFUND_META, config as Record<string, unknown>, "refund a payment"),
});
