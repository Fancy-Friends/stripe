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
 * Refund a Stripe payment, in full or in part.
 *
 * POST /v1/refunds — https://docs.stripe.com/api/refunds/create
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

export const REFUND_CREATE_OPERATION = "refund_create";

export type RefundCreateOptions = {
  /** The node's resolved config. Keys: paymentIntent, amount, reason, metadata. */
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

export async function stripeRefundCreate(options: RefundCreateOptions): Promise<ConnectorResult> {
  const config = options.config ?? {};

  if (config.paymentIntent === undefined || config.paymentIntent === null || config.paymentIntent === "") {
    throw new Error(`refund_create: "paymentIntent" is required (Payment intent).`);
  }

  {
    const n = Number(config.amount);
    const given = config.amount !== undefined && config.amount !== null && config.amount !== "";
    if (given && !(Number.isInteger(n) && n >= 1)) {
      throw new Error(
        `refund_create: "amount" must be a positive whole number in the currency's smallest unit (1000 = $10.00), or empty for a full refund, got ${JSON.stringify(config.amount)}.`,
      );
    }
  }

  return callConnector(STRIPE, {
    operation: REFUND_CREATE_OPERATION,
    config,
    input: options.input,
    ...(options.credentials === undefined ? {} : { credentials: options.credentials }),
    ...(options.mode === undefined ? {} : { mode: options.mode }),
    ...(options.connectionId === undefined ? {} : { connectionId: options.connectionId }),
    ...(options.attempts === undefined ? {} : { attempts: options.attempts }),
    ...(options.transport === undefined ? {} : { transport: options.transport }),
    ...(options.idempotencyKey === undefined ? {} : { idempotencyKey: options.idempotencyKey }),
    request: {
      method: "POST",
      path: "/v1/refunds",
      form: {
        "payment_intent": String(config.paymentIntent),
        ...(config.amount !== undefined && config.amount !== null && config.amount !== "" ? { "amount": Math.trunc(Number(config.amount)) } : {}),
        ...(config.reason !== undefined && config.reason !== null && config.reason !== "" ? { "reason": String(config.reason) } : {}),
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
