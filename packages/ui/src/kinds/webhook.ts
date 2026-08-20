/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/triggers/webhook.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/triggers/webhook.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

/**
 * Stripe event — Start when Stripe reports an event.
 *
 * https://docs.stripe.com/webhooks
 *
 * Delivery: webhook. Add an endpoint in the Stripe dashboard (or via POST
 * /v1/webhook_endpoints) pointing at the route your host mounts for this
 * trigger, then put the endpoint's signing secret on the connection as
 * `webhookSecret`.
 */

import type { NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

import { defineConnectorKind, summarize } from "../connector.js";
import { stripeMeta } from "../service.js";

export const STRIPE_WEBHOOK_TRIGGER_KIND = "@particle-academy/stripe_webhook_trigger";
export const STRIPE_WEBHOOK_TRIGGER_OPERATION = "webhook";

export const STRIPE_WEBHOOK_TRIGGER_META = stripeMeta("trigger", "an event", "https://docs.stripe.com/webhooks");

/**
 * What this node emits — the "ingredients" a downstream node can reference.
 *
 * fancy-flow reads `outputShape` off the kind and offers it in the variable
 * picker, so declaring it is the whole of the work: an author configuring the
 * next node picks `{{ $json.data.id }}` off a list instead of typing a path
 * and hoping.
 */
export const STRIPE_WEBHOOK_TRIGGER_OUTPUT: OutputField[] = [
  {
    "path": "id",
    "type": "string",
    "description": "Event id (evt_…). Stripe redelivers on failure — dedupe on this."
  },
  {
    "path": "type",
    "type": "string",
    "description": "The event type, e.g. payment_intent.succeeded."
  },
  {
    "path": "created",
    "type": "number",
    "description": "Unix seconds."
  },
  {
    "path": "livemode",
    "type": "boolean",
    "description": "FALSE for test-mode events. Branch on this before acting on money."
  },
  {
    "path": "data.object.id",
    "type": "string",
    "description": "Id of the object the event is about."
  },
  {
    "path": "data.object.object",
    "type": "string",
    "description": "Which kind of object: payment_intent, charge, checkout.session, subscription…"
  },
  {
    "path": "data.object.amount",
    "type": "number",
    "description": "Amount, where the object carries one."
  },
  {
    "path": "data.object.currency",
    "type": "string",
    "description": "Three-letter ISO currency code."
  },
  {
    "path": "data.object.status",
    "type": "string",
    "description": "The object's status."
  }
];

export const stripeWebhookTriggerKind: NodeKindDefinition = defineConnectorKind(STRIPE_WEBHOOK_TRIGGER_META, {
  name: STRIPE_WEBHOOK_TRIGGER_KIND,
  aliases: ["stripe_webhook_trigger"],
  label: "Stripe event",
  description: "Start when Stripe reports an event.",
  icon: "◈",
  inputs: [],
  outputs: [{ id: "out" }],
  sideEffects: "none",
  outputShape: STRIPE_WEBHOOK_TRIGGER_OUTPUT,
  configSchema: [
    {
      "type": "text",
      "key": "eventTypes",
      "label": "Event types",
      "placeholder": "payment_intent.succeeded, charge.refunded",
      "description": "Comma separated. Leave blank to accept every event Stripe sends to this endpoint. A delivery whose type is not listed settles the trigger without starting the graph."
    },
    {
      "type": "select",
      "key": "sample",
      "label": "Sample event",
      "description": "Which event shape to emit in fake mode, so downstream nodes can be wired before Stripe has ever been contacted.",
      "default": "payment_intent.succeeded",
      "options": [
        {
          "value": "payment_intent.succeeded",
          "label": "payment_intent.succeeded"
        },
        {
          "value": "charge.refunded",
          "label": "charge.refunded"
        },
        {
          "value": "checkout.session.completed",
          "label": "checkout.session.completed"
        },
        {
          "value": "customer.subscription.deleted",
          "label": "customer.subscription.deleted"
        }
      ]
    }
  ],
  defaultConfig: {
    "mode": "auto",
    "sample": "payment_intent.succeeded"
  },
  renderBody: ({ config }) =>
    summarize(STRIPE_WEBHOOK_TRIGGER_META, config as Record<string, unknown>, "an event"),
});
