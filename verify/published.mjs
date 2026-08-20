/*
 * Stripe — the published npm packages.
 *
 * GENERATED — do not edit. Fix weaver's template/ and regenerate.
 *
 * This runs against the PUBLISHED package, installed by name from the
 * registry into a project that has never seen this repo. Every other test
 * here imports from ../src and therefore cannot see the packaging.
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { stripeFaker } from "@particle-academy/stripe-js";
import { STRIPE_KINDS } from "@particle-academy/stripe-ui";
import { fakeRequest } from "@particle-academy/fancy-connector-core";

/*
 * WHERE did that come from?
 *
 * Node resolves a bare specifier from the importing MODULE's directory, not
 * the working directory. So running this script across from a checkout
 * resolves out of the REPO's node_modules and silently tests the source
 * again — which it did, and passed, before CI caught it.
 *
 * Two things are checked, because neither is enough alone: that the package
 * came from an INSTALL rather than from source, and that this script is not
 * sitting inside the provider repo it is supposed to be testing.
 */
const resolved = import.meta.resolve("@particle-academy/stripe-js");
const here = dirname(fileURLToPath(import.meta.url));

assert.ok(
  !existsSync(join(here, "..", "packages", "js", "package.json")),
  `${here} is inside the provider repo, so a bare import resolves the repo's ` +
    "own node_modules. Copy this script into a project that installed the " +
    "published package and run it there.",
);
assert.match(resolved, /node_modules/, `resolved ${resolved}, which is not an installed package`);
console.log(`  ok   resolved from ${resolved}`);

const GOLDENS = [
  {
    "operation": "customer_create",
    "config": {},
    "expected": {
      "id": "cus_fake_17ed1b8c2704",
      "object": "customer",
      "email": "ada@example.test",
      "name": null,
      "created": 1767225600,
      "livemode": false
    }
  },
  {
    "operation": "payment_intent_create",
    "config": {
      "currency": "usd"
    },
    "expected": {
      "id": "pi_fake_303f74a80be9",
      "object": "payment_intent",
      "amount": 19569,
      "amount_received": 19569,
      "currency": "usd",
      "customer": null,
      "description": null,
      "status": "succeeded",
      "livemode": false,
      "created": 1767225600,
      "latest_charge": "ch_fake_00cc67960be2",
      "receipt_email": null
    }
  },
  {
    "operation": "refund_create",
    "config": {},
    "expected": {
      "id": "re_fake_f64f4068d60b",
      "object": "refund",
      "amount": 14142,
      "currency": "usd",
      "payment_intent": "pi_fake_e67c4c2090f7",
      "reason": null,
      "status": "succeeded",
      "created": 1767225600
    }
  },
  {
    "operation": "webhook",
    "config": {
      "sample": "payment_intent.succeeded"
    },
    "expected": {
      "id": "evt_fake_80bf44d16c8f",
      "object": "event",
      "type": "payment_intent.succeeded",
      "api_version": "2026-01-01",
      "created": 1767225600,
      "livemode": false,
      "data": {
        "object": {
          "id": "pi_fake_4f2fc32a5e11",
          "object": "payment_intent",
          "amount": 2500,
          "amount_received": 2500,
          "currency": "usd",
          "status": "succeeded"
        }
      }
    }
  }
];

for (const { operation, config, expected } of GOLDENS) {
  const faked = stripeFaker(operation, fakeRequest("stripe", operation, config));

  assert.deepEqual(
    faked,
    expected,
    `the PUBLISHED package produced different bytes for ${operation} than the repo does`,
  );
  console.log(`  ok   ${operation}`);
}

// The ui package is a separate tarball, and js depends on it by its
// published name — so this also proves that dependency resolves.
assert.equal(STRIPE_KINDS.length, 4);
for (const kind of STRIPE_KINDS) {
  const keys = kind.configSchema.map((field) => field.key);
  assert.equal(keys[0], "connection");
  assert.equal(keys[1], "mode");
  assert.ok(kind.outputShape.length > 0, `${kind.name} declares no output shape`);
}
console.log(`  ok   ui kinds resolve from ${"@particle-academy/stripe-ui"}`);

console.log(`\n  ${GOLDENS.length} operations verified against the published packages.`);
