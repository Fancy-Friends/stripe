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
 * Stripe's identity on the authoring surface, shared by every Stripe node.
 *
 * This file must import nothing from the js package: a PHP or Python project
 * installs the ui package and never that one, and the import would be a
 * dangling module the moment it did.
 *
 * ## The sandbox trap
 *
 * Stripe's test estate is selected by the KEY, not the URL -- api.stripe.com
 * serves both. A live key sent to a node whose mode says "sandbox" reaches the
 * real ledger and succeeds. Nothing in the request distinguishes them, which
 * is exactly why credentials sit on the connection rather than on twelve
 * separate nodes.
 */

import type { ConnectorDomain, ConnectorMeta } from "@particle-academy/fancy-flow/connectors";

/**
 * The connector API version this package was GENERATED against.
 *
 * A literal, never imported — an imported constant lets an upgrade rewrite the
 * very claim it exists to detect.
 */
export const CONNECTOR_API_VERSION = 1;

/** The parts of a connector's identity that belong to the SERVICE, not the node. */
export const STRIPE_SERVICE = {
  service: "stripe",
  serviceTitle: "Stripe",
  domain: "payments",
  sandbox: "credential",
} as const satisfies Pick<ConnectorMeta, "service" | "serviceTitle" | "domain" | "sandbox">;

/**
 * Every connector domain weaver knows, pinned against fancy-flow's union.
 *
 * A closed set copied into three codebases stays correct only while something
 * MAKES it: this line fails to compile the moment weaver carries a value
 * fancy-flow does not, including the values no provider uses yet.
 */
const WEAVER_DOMAINS: readonly ConnectorDomain[] = [
  "payments",
  "commerce",
  "messaging",
  "email",
  "crm",
  "support",
  "storage",
  "calendar",
  "productivity",
  "database",
  "devtools",
  "analytics",
  "marketing",
  "ai",
  "forms",
  "hr",
  "geo"
];
void WEAVER_DOMAINS;

/** The credentials a Stripe connection holds. */
export const STRIPE_CREDENTIALS = [
  {
    "key": "secretKey",
    "label": "Secret key",
    "scope": "account",
    "secret": true,
    "help": "sk_test_... for the test estate, sk_live_... for the real ledger. The key -- not the URL -- decides which one you reach."
  },
  {
    "key": "webhookSecret",
    "label": "Webhook signing secret",
    "scope": "account",
    "secret": true,
    "optional": true,
    "help": "whsec_... from the endpoint you added in the Stripe dashboard. Required only by the webhook trigger."
  }
] as const;

/** Build a Stripe node's connector metadata from the operation it performs. */
export function stripeMeta(
  role: ConnectorMeta["role"],
  operation: string,
  docs: string,
): ConnectorMeta {
  return { ...STRIPE_SERVICE, role, operation, docs };
}
