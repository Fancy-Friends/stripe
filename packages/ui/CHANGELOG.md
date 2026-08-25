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

## [0.3.0] — 2026-08-24

### Added

- **The README now says how to SET THIS CONNECTOR UP**, in the package itself.

Until now it explained what the four packages are, what they cost and why the
repo is generated — and said nothing about credentials, scopes, sandboxes or
operations. Somebody who installed it could not learn from it which credentials
a connection needs, where a human GETS them, which scopes to request, or what
the connector can actually do. All of that was already in the definition; the
one document a consumer reads was the one that omitted everything actionable.

The new **Setting it up** section carries:

- every credential, with the text saying where the value comes from, whether it
  is **per installation** or **per connected account**, and whether it is secret;
- the OAuth authorize and token URLs and the exact scopes, verbatim;
- the access-token lifetime, and where refresh tokens ROTATE, the two things a
  host must not do — retry a failed refresh, or refresh concurrently — because a
  replay revokes the entire grant and nothing in the failure says why;
- the estate in this provider's own terms, including the cases where a
  successful-looking run reaches nobody, or reaches the real one;
- every action and trigger with its method, path, inputs, and whether it is safe
  to replay;
- a trigger's provider-side setup, which nobody can derive from anything else.

It is **generated from `provider/manifest.json`**, so it cannot drift from what
the packages do — which is the point at a few hundred providers, where a
hand-written setup section is a few hundred documents going quietly stale.

No code changed. This release exists because a registry and an installing agent
read the PUBLISHED artifact, and the artifact carried the old README.

## [Unreleased]

## [0.2.0] — 2026-08-24

### Changed

- **`@particle-academy/stripe-ui` is now an OPTIONAL PEER dependency of `@particle-academy/stripe-js`, not a hard one.**

`./flow` needs it; nothing else does. It was a hard dependency, and because
`@particle-academy/stripe-ui` itself peer-depends on `fancy-flow` — which npm 7+ installs
automatically — `npm install @particle-academy/stripe-js` pulled the **entire flow engine**
onto disk for a consumer who only wanted to call the API. Roughly **18 MB
became 874 KB**, and the package works exactly as before:

```js
import { stripe… } from "@particle-academy/stripe-js";
// an injected transport, no flow engine anywhere
```

**This is breaking if you use `@particle-academy/stripe-js/flow`.** Add `@particle-academy/stripe-ui` to your own
dependencies — it was always being installed for you, and now it is declared.
Everything importing only the main entry point is unaffected.

The fix is on this edge rather than on `@particle-academy/stripe-ui` → `fancy-flow`: the ui package
genuinely requires fancy-flow, since it calls `defineConnectorKind`, and marking
that peer optional would be a lie about what it needs.

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
[0.2.0]: https://github.com/Fancy-Friends/stripe/releases/tag/v0.2.0
[0.3.0]: https://github.com/Fancy-Friends/stripe/releases/tag/v0.3.0
