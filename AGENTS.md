# AGENTS.md — Stripe

**This whole repository is generated.** `provider/` is the source; everything
under `packages/` is emitted from it by [weaver][weaver], the envelope that owns
this estate. There is no hand-written code here.

[weaver]: https://github.com/Fancy-Friends/weaver.agi

## The one rule

**Never hand-edit anything under `packages/`.** Fix `provider/` — or fix
weaver's `template/` — and regenerate. A hand-edit is destroyed by the next
protocol sync, which is *worse* than being rejected, because it works until it
silently doesn't. `ci.yml` regenerates and diffs on every push, so an edit here
fails the build rather than shipping.

```bash
# in the weaver envelope
npm run provider -- stripe            # regenerate this repo
npm run provider -- stripe --check    # exit 1 on any difference
```

## What is where

| Path | What | Hand-written? |
|---|---|---|
| `provider/manifest.json` | Service identity, auth, estates, idempotency | **Yes** |
| `provider/actions/*.json` | One per operation: request, config schema, output shape | **Yes** |
| `provider/triggers/*.json` | Delivery mechanism and signature scheme | **Yes** |
| `provider/fixtures/*.json` | Faker responses — required for every action and trigger | **Yes** |
| `packages/ui` | `@particle-academy/stripe-ui` — the authoring surface, React, every host | Generated |
| `packages/js` | `@particle-academy/stripe-js` — Node, on `@particle-academy/fancy-connector-core` | Generated |
| `packages/php` | `particle-academy/stripe-php` — PHP 8.4, on `particle-academy/fancy-connector-core` | Generated |
| `packages/py` | `fancy-stripe` — Python 3.11+, stdlib only | Generated |

The authoritative copy of `provider/` lives in the weaver envelope at
`providers/stripe/provider/`. The copy here is emitted from it and `--check`
fails when the two differ — one source, two distribution channels, and the check
is what makes that safe.

## Two namespaces, which do not match on purpose

| | Namespace |
|---|---|
| This repo | `github.com/Fancy-Friends/stripe` |
| npm | `@particle-academy/stripe-ui`, `@particle-academy/stripe-js` |
| Packagist | `particle-academy/stripe-php` |
| PyPI | `fancy-stripe` |

Nothing derives one from the other. Naming a package after its GitHub org is the
intuitive mistake, and **on npm it cannot be undone**. The names come from
weaver's `friends.json` and nowhere else.

## Invariants CI enforces

- **A faker for every action and trigger**, sandbox or no sandbox. A connector
  without one cannot be developed against, tested, or demonstrated.
- **The golden fixtures assert the same bytes in TypeScript, PHP and Python.**
  That is the parity test: cross-runtime drift does not fail loudly on its own —
  it completes, down one path, with no error.
- **Every package ships a test script.** A package without one reports green by
  doing nothing, which is the one defect that hides itself.
- **A CHANGELOG entry at tag time**, checked before anything is built.
- **`CONNECTOR_API_VERSION` is declared as a literal, never imported.** An
  imported constant lets an upgrade rewrite the very claim it exists to detect.

## Third-party code

**Default to plain HTTP.** A Stripe SDK is third-party code and is subject to
the kit's full bar: owner approval, and a project updated within the last 3
months. One SDK per provider is hundreds of dependencies nobody is tracking, and
the generator cannot introduce one on its own — a test asserts every dependency
is first-party.

## Process rules live in the envelope

Publishing, versioning, backports, the support lifecycle and the third-party
approval bar are in the Fancy envelope's `AGENTS.md`. They are deliberately not
repeated here: a copy in a repo freezes at whatever the rule was the day it was
written, and then quietly contradicts the real one.
