# Changelog — Stripe

All four packages — `@particle-academy/stripe-ui`, `@particle-academy/stripe-js`,
`particle-academy/stripe-php` and `fancy-stripe` — are released together under
one version. They are generated from one `provider/` definition, so a change to
it changes all four, and separate version lines would only record which of the
four somebody remembered to bump.

**Write entries HERE**, in the weaver envelope at `providers/stripe/CHANGELOG.md`,
then regenerate. This file is the one thing in a provider release that cannot be
derived from anything — but it is still propagated rather than hand-edited in the
provider repo, because a copy edited there is destroyed by the next protocol sync.

**A release with no entry is refused at tag time.** `publish.yml` checks before
it builds anything, so the failure costs seconds rather than a half-published
version across three registries — and once a tarball is on a registry, nobody who
upgraded into it can learn what changed.

## [Unreleased]

## [0.1.0] — 2026-08-20

First release. Ported from the vendored flow-node connector at
`px-ui-sandbox/resources/flow-nodes/_stripe`, which could not be upgraded once a
consumer had copied it — that is the whole reason these are packages.

### Added

- **Three actions.** `payment_intent_create` (take a payment),
  `refund_create` (refund one, in full or in part) and `customer_create`.
  All three are `unsafe-to-replay` and send an `Idempotency-Key` derived from the
  run and the step, so a retried durable run returns the original result instead
  of charging twice.
- **A verified webhook trigger.** Stripe packs the timestamp inside the
  signature header (`t=…,v1=…`), signs `{t}.{rawBody}` under HMAC-SHA256, and
  allows a five-minute replay window. The body must be the bytes exactly as
  received: re-serialised JSON fails identically to a wrong secret.
- **A faker for every action and the trigger**, so a node runs before you have
  an account, a key or a network. The faked values are deterministic and
  obviously synthetic, and `livemode` is always `false` — it is the field a
  downstream branch reads before acting on money.
- **Four packages from one definition**: `-ui` (the authoring surface, React on
  every host), `-js` (Node), `-php` (8.4+) and `fancy-stripe` (Python 3.11+,
  zero runtime dependencies).

### Notes

- **Stripe's test estate is selected by the KEY, not the URL.** `api.stripe.com`
  serves both, so a live key on a node whose mode says "sandbox" reaches the real
  ledger and succeeds. Nothing in the request distinguishes them, which is why
  credentials sit on the connection rather than on each node. The `sandbox` kind
  is `credential` for exactly this reason.
- **No Stripe SDK.** Plain HTTP: a vendor SDK is third-party code subject to the
  kit's full approval bar, and one per provider is hundreds of dependencies
  nobody is tracking.
