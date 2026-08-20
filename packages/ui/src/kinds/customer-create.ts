/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/customer-create.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/customer-create.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

/**
 * Stripe customer — Create a Stripe customer.
 *
 * https://docs.stripe.com/api/customers/create
 *
 * `unsafe-to-replay`, and the idempotency key is why that is survivable rather
 * than merely declared: a durable run that retries this node sends the same
 * `Idempotency-Key`, so Stripe returns the original result instead of creating
 * a second one.
 */

import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { defineConnectorKind, summarize, type OutputField } from "@particle-academy/fancy-flow/connectors";
import { stripeMeta } from "../service.js";

export const STRIPE_CUSTOMER_KIND = "@particle-academy/stripe_customer";
export const STRIPE_CUSTOMER_OPERATION = "customer_create";

export const STRIPE_CUSTOMER_META = stripeMeta("action", "create a customer", "https://docs.stripe.com/api/customers/create");

/**
 * What this node emits — the "ingredients" a downstream node can reference.
 *
 * fancy-flow reads `outputShape` off the kind and offers it in the variable
 * picker, so declaring it is the whole of the work: an author configuring the
 * next node picks `{{ $json.data.id }}` off a list instead of typing a path
 * and hoping.
 */
export const STRIPE_CUSTOMER_OUTPUT: OutputField[] = [
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
    "description": "Customer id (cus_…)."
  },
  {
    "path": "data.email",
    "type": "string",
    "description": "The customer's email."
  },
  {
    "path": "data.name",
    "type": "string",
    "description": "The customer's name, when one was given."
  },
  {
    "path": "data.created",
    "type": "number",
    "description": "Unix seconds."
  },
  {
    "path": "data.livemode",
    "type": "boolean",
    "description": "FALSE for test-mode records."
  }
];

export const stripeCustomerKind: NodeKindDefinition = defineConnectorKind(STRIPE_CUSTOMER_META, {
  name: STRIPE_CUSTOMER_KIND,
  aliases: ["stripe_customer"],
  label: "Stripe customer",
  description: "Create a Stripe customer.",
  icon: "◆",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  sideEffects: "unsafe-to-replay",
  outputShape: STRIPE_CUSTOMER_OUTPUT,
  configSchema: [
    {
      "type": "expression",
      "key": "email",
      "label": "Email",
      "example": "{{ $json.email }}",
      "required": true
    },
    {
      "type": "expression",
      "key": "name",
      "label": "Name",
      "example": "{{ $json.name }}"
    },
    {
      "type": "expression",
      "key": "phone",
      "label": "Phone",
      "example": "{{ $json.phone }}"
    },
    {
      "type": "keyvalue",
      "key": "metadata",
      "label": "Metadata",
      "keyPlaceholder": "user_id",
      "valuePlaceholder": "{{ $json.user_id }}"
    }
  ],
  defaultConfig: {
    "mode": "auto"
  },
  renderBody: ({ config }) =>
    summarize(STRIPE_CUSTOMER_META, config as Record<string, unknown>, "create a customer"),
});
