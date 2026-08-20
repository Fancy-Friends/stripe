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
 * Stripe, as one service descriptor shared by every Stripe operation.
 *
 * @particle-academy/fancy-connector-core carries what is true of ALL
 * connectors. This carries what is true of Stripe: its base URL, its auth
 * scheme, its idempotency header, and its faker.
 *
 * ## The sandbox trap, written down where it is used
 *
 * Stripe's test estate is selected by the KEY, not the URL -- api.stripe.com
 * serves both. A live key sent to a node whose mode says "sandbox" reaches the
 * real ledger and succeeds. Nothing in the request distinguishes them, which
 * is exactly why credentials sit on the connection rather than on twelve
 * separate nodes.
 */

import type { ConnectorMode, PreparedRequest, ServiceDescriptor } from "@particle-academy/fancy-connector-core";

import { stripeFaker } from "./faker.js";

/**
 * The connector API version this package was GENERATED against.
 *
 * A literal, never imported. An imported constant lets an upgrade rewrite the
 * very claim it exists to detect, after which the copy agrees with itself
 * forever.
 */
export const CONNECTOR_API_VERSION = 1;

export const STRIPE_BASE_URLS = {
  "live": "https://api.stripe.com",
  "sandbox": "https://api.stripe.com"
} as const;

/** Credential keys a remote call cannot proceed without. */
export const STRIPE_REQUIRES = [
  "secretKey"
] as const;

/**
 * Apply Stripe's auth scheme to an outgoing request.
 *
 * Bearer, not Basic. Stripe accepts the key as a Basic username too, and both
 * are documented, but one spelling in one place is one fewer thing to get
 * subtly wrong.
 *
 * The mode is passed in because for some providers auth and estate are the
 * same decision expressed in the URL; here it is unused, and saying so is
 * cheaper than wondering later whether it was forgotten.
 */
export function stripeAuthorize(
  credentials: Record<string, string | undefined>,
  request: PreparedRequest,
  _mode: ConnectorMode,
): void {
  request.headers.Authorization = `Bearer ${credentials.secretKey ?? ""}`;
}

/** The Stripe service, for the TypeScript runtime. */
export const STRIPE: ServiceDescriptor = {
  service: "stripe",
  title: "Stripe",
  sandbox: "credential",
  baseUrls: { ...STRIPE_BASE_URLS },
  requires: [...STRIPE_REQUIRES],
  authorize: stripeAuthorize,
  // Retried durable runs MUST not create a second charge. This header is what
  // makes `unsafe-to-replay` recoverable rather than merely forbidden.
  idempotencyHeader: "Idempotency-Key",
  faker: stripeFaker,
};
