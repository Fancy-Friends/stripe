/**
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/payment-intent-create.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/payment-intent-create.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */

/**
 * Create a Stripe PaymentIntent — take a payment.
 *
 * POST /v1/payment_intents —
 * https://docs.stripe.com/api/payment_intents/create
 *
 * Notice what is NOT here: no key, no base URL, no mode check, no retry loop,
 * no fake/real branch. This describes the request; callConnector resolves the
 * connection, picks the estate, and either calls Stripe or calls the faker.
 *
 * sideEffects: unsafe-to-replay. Pass an idempotencyKey derived from the RUN
 * and the STEP, never a fresh one — that is what turns "never retry" into
 * "retry safely".
 */

import {
  callConnector,
  type ConnectorResult,
  type RequestedMode,
  type Transport,
} from "@particle-academy/fancy-connector-core";
import { STRIPE } from "../service.js";

export const PAYMENT_INTENT_CREATE_OPERATION = "payment_intent_create";

export type PaymentIntentCreateOptions = {
  /** The node's resolved config. Keys: amount, currency, customer, description, receiptEmail, metadata. */
  config: Record<string, unknown>;
  credentials?: Record<string, string | undefined>;
  mode?: RequestedMode;
  connectionId?: string | null;
  input?: unknown;
  /** Derived from the run and the step, never fresh. See the note above. */
  idempotencyKey?: string;
  attempts?: number;
  /** Override the transport. The only way to exercise this without a network. */
  transport?: Transport;
};

export async function stripePaymentIntentCreate(options: PaymentIntentCreateOptions): Promise<ConnectorResult> {
  const config = options.config ?? {};

  {
    const n = Number(config.amount);
    if (!(Number.isInteger(n) && n >= 1)) {
      throw new Error(
        `payment_intent_create: "amount" must be a positive whole number in the currency's smallest unit (1000 = $10.00), got ${JSON.stringify(config.amount)}.`,
      );
    }
  }

  return callConnector(STRIPE, {
    operation: PAYMENT_INTENT_CREATE_OPERATION,
    config,
    input: options.input,
    ...(options.credentials === undefined ? {} : { credentials: options.credentials }),
    ...(options.mode === undefined || options.mode === "auto" ? {} : { mode: options.mode }),
    ...(options.connectionId === undefined ? {} : { connectionId: options.connectionId }),
    ...(options.attempts === undefined ? {} : { attempts: options.attempts }),
    ...(options.transport === undefined ? {} : { transport: options.transport }),
    ...(options.idempotencyKey === undefined ? {} : { idempotencyKey: options.idempotencyKey }),
    request: {
      method: "POST",
      path: "/v1/payment_intents",
      form: {
        "amount": Math.trunc(Number(config.amount)),
        "currency": config.currency !== undefined && config.currency !== null && config.currency !== "" ? String(config.currency).toLowerCase() : "usd",
        ...(config.customer !== undefined && config.customer !== null && config.customer !== "" ? { "customer": String(config.customer) } : {}),
        ...(config.description !== undefined && config.description !== null && config.description !== "" ? { "description": String(config.description) } : {}),
        ...(config.receiptEmail !== undefined && config.receiptEmail !== null && config.receiptEmail !== "" ? { "receipt_email": String(config.receiptEmail) } : {}),
        ...metadataForm(config.metadata),
      },
    },
  });
}

/** `{ order_id: "7" }` → `{ "metadata[order_id]": "7" }`. */
function metadataForm(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};

  const form: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item !== undefined && item !== null && item !== "") form[`metadata[${key}]`] = String(item);
  }

  return form;
}
