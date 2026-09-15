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
 * Stripe's webhook trigger — the delivery contract.
 *
 * Kept beside the service descriptor rather than inside a node, because a
 * signature scheme is a fact about STRIPE. Two Stripe triggers must not be
 * able to disagree about how a delivery is verified.
 */

import { verifyDelivery, type HmacScheme, type InboundDelivery, type TriggerDescriptor, type WebhookVerification } from "@particle-academy/fancy-connector-core";
import { stripeFaker } from "../faker.js";

export const STRIPE_WEBHOOK_SIGNATURE_HEADER = "Stripe-Signature";
/** The provider's documented replay window, in seconds. */
export const STRIPE_WEBHOOK_TOLERANCE = 300;

export const STRIPE_WEBHOOK_SCHEME: HmacScheme = {
  algorithm: "SHA-256",
  payload: (raw, timestamp) => `${timestamp}.${raw}`,
  tolerance: STRIPE_WEBHOOK_TOLERANCE,
  encoding: "hex",
};

/**
 * Split `t=…,v1=…` into its parts.
 *
 * EVERY signature the header carries is collected, and the delivery passes
 * when ANY matches: a provider rolling a secret signs once per active secret,
 * and a first-only rule refused the whole roll as a wrong secret.
 *
 * Stripe packs the timestamp INTO the signature header (`t=…,v1=…`) rather
 * than sending one of its own. Several `v1` values arrive while a secret is
 * rolled -- one per active secret, for up to 24 hours -- and Stripe says to
 * compare against EACH. Every `v1` is offered and the delivery passes when any
 * matches. Until 0.3.5 only the FIRST was taken, on the reasoning that a
 * fallback made "which one matched" ambiguous; that refused every delivery
 * whose first signature came from the new secret, for the whole roll, and it
 * read as a wrong secret on the day the secret was changed.
 */
export function parseStripeSignature(raw: string): {
  signatures: string[];
  timestamp?: string;
} {
  const result: { signatures: string[]; timestamp?: string } = { signatures: [] };

  for (const part of raw.split(",")) {
    const [key, value] = part.trim().split("=", 2);
    if (value === undefined) continue;

    if (key === "t") result.timestamp = value;
    if (key === "v1") {
      result.signatures.push(value);
    }
  }

  return result;
}

export const STRIPE_WEBHOOK: TriggerDescriptor = {
  service: "stripe",
  operation: "webhook",
  delivery: "webhook",
  setup:
    "Add an endpoint in the Stripe dashboard (or via POST /v1/webhook_endpoints) pointing at the route your host mounts for this trigger, then put the endpoint's signing secret on the connection as `webhookSecret`.",
  verification: {
    signatureHeader: STRIPE_WEBHOOK_SIGNATURE_HEADER,
    scheme: STRIPE_WEBHOOK_SCHEME,
    parse: parseStripeSignature,
  },
  faker: stripeFaker,
};

/**
 * Verify one inbound Stripe delivery.
 *
 * The host calls this BEFORE starting a run, with the body exactly as
 * received. Re-serialised JSON changes key order and whitespace, and produces
 * a mismatch that looks precisely like a wrong secret — hours of debugging the
 * wrong thing.
 *
 * The secret is the connection's `webhookSecret`.
 */
export function verifyStripeDelivery(
  delivery: InboundDelivery,
  webhookSecret: string | undefined,
  now?: number,
): Promise<WebhookVerification> {
  return verifyDelivery(STRIPE_WEBHOOK, delivery, webhookSecret, now);
}
