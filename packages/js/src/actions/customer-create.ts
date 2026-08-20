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
 * Create a Stripe customer.
 *
 * POST /v1/customers — https://docs.stripe.com/api/customers/create
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

export const CUSTOMER_CREATE_OPERATION = "customer_create";

export type CustomerCreateOptions = {
  /** The node's resolved config. Keys: email, name, phone, metadata. */
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

export async function stripeCustomerCreate(options: CustomerCreateOptions): Promise<ConnectorResult> {
  const config = options.config ?? {};

  if (config.email === undefined || config.email === null || config.email === "") {
    throw new Error(`customer_create: "email" is required (Email).`);
  }

  return callConnector(STRIPE, {
    operation: CUSTOMER_CREATE_OPERATION,
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
      path: "/v1/customers",
      form: {
        "email": String(config.email).trim(),
        ...(config.name !== undefined && config.name !== null && config.name !== "" ? { "name": String(config.name) } : {}),
        ...(config.phone !== undefined && config.phone !== null && config.phone !== "" ? { "phone": String(config.phone) } : {}),
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
