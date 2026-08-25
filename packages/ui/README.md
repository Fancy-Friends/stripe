# Stripe

Stripe for [fancy-flow][flow] — as **four imported, versioned packages**, one
per runtime. Not vendored source: a copy cannot be upgraded, and third-party APIs
change.

[flow]: https://github.com/Particle-Academy/fancy-flow

| Runtime | Package | Install |
|---|---|---|
| Authoring surface (every host) | `@particle-academy/stripe-ui` | `npm install @particle-academy/stripe-ui` |
| Node | `@particle-academy/stripe-js` | `npm install @particle-academy/stripe-js` |
| PHP 8.4+ | `particle-academy/stripe-php` | `composer require particle-academy/stripe-php` |
| Python 3.11+ | `fancy-stripe` | `pip install fancy-stripe` |

The `ui` package is the editor surface and is React on every host — a PHP or
Python project installs it *and* its own runtime package, and never the `js` one.

## What it costs you

One dependency: `@particle-academy/fancy-connector-core` (or
`particle-academy/fancy-connector-core` on Composer), which the `js` and `php`
packages pull in themselves. The Python package has **zero** runtime
dependencies.

**No Stripe SDK.** Plain HTTP, deliberately: a vendor SDK is third-party code
subject to the kit's full approval bar, and one per provider is hundreds of
dependencies nobody is tracking.

## Setting it up

Everything below is generated from `provider/manifest.json`, so it cannot disagree with what the packages do.

### Credentials

A Stripe connection holds 2 values.

Every value here is `account` scope: one per connected account, not one per installation.

| Field | Scope | Secret | Where it comes from |
|---|---|---|---|
| **Secret key** | per connected account | **secret** | sk_test_... for the test estate, sk_live_... for the real ledger. The key -- not the URL -- decides which one you reach. |
| **Webhook signing secret** *(optional)* | per connected account | **secret** | whsec_... from the endpoint you added in the Stripe dashboard. Required only by the webhook trigger. |

### The estate

**Stripe decides live-or-test by the KEY, not by the endpoint.** The same host serves both, and a live key pointed at a node marked “sandbox” reaches the real estate and SUCCEEDS. Nothing in the request distinguishes them, which is why credentials sit on the connection rather than on each node.

> Stripe's test estate is selected by the KEY, not the URL -- api.stripe.com serves both. A live key sent to a node whose mode says "sandbox" reaches the real ledger and succeeds. Nothing in the request distinguishes them, which is exactly why credentials sit on the connection rather than on twelve separate nodes.

## What it can do

### Actions

#### `customer_create` — Stripe customer

Create a Stripe customer.

`POST /v1/customers` · **unsafe to replay** — a retried durable run does it TWICE

| Input | Required | What it is |
|---|---|---|
| `email` | yes | Email |
| `name` | no | Name |
| `phone` | no | Phone |
| `metadata` | no | Metadata |

#### `payment_intent_create` — Stripe payment

Create a Stripe PaymentIntent — take a payment.

`POST /v1/payment_intents` · **unsafe to replay** — a retried durable run does it TWICE

| Input | Required | What it is |
|---|---|---|
| `amount` | yes | In the currency's smallest unit — 1000 is $10.00. Stripe has no decimal amounts. |
| `currency` | no | Currency |
| `customer` | no | Customer |
| `description` | no | Description |
| `receiptEmail` | no | Receipt email |
| `metadata` | no | Sent to Stripe as metadata[key]=value. The usual way to find this payment again later. |

#### `refund_create` — Stripe refund

Refund a Stripe payment, in full or in part.

`POST /v1/refunds` · **unsafe to replay** — a retried durable run does it TWICE

| Input | Required | What it is |
|---|---|---|
| `paymentIntent` | yes | The pi_… to refund. Usually carried forward from a Stripe payment node. |
| `amount` | no | In the currency's smallest unit. Leave empty to refund the whole payment. |
| `reason` | no | Stripe accepts only these three values. Anything else is rejected at the API. |
| `metadata` | no | Metadata |

### Triggers

#### `webhook` — Stripe event

Start when Stripe reports an event.

Delivered by webhook, and the signature is verified before anything runs.

**You have to set this up with the provider first:**

Add an endpoint in the Stripe dashboard (or via POST /v1/webhook_endpoints) pointing at the route your host mounts for this trigger, then put the endpoint's signing secret on the connection as `webhookSecret`.

## Run it before you have credentials

Every operation ships a **faker**, whether or not Stripe has a sandbox. Set a
node's mode to `fake` and it returns the shape Stripe actually publishes — the
same field names, deterministically — so you can wire the downstream nodes before
touching an account, a key, or a network.

## This repository is generated

`provider/` is the source. Everything under `packages/` is emitted from it and
**must not be hand-edited** — CI regenerates and diffs on every push, and the
next protocol sync destroys anything it finds. See [`AGENTS.md`](AGENTS.md).

## Two namespaces, which do not match on purpose

The repo is `github.com/Fancy-Friends/stripe`; the packages publish under
`particle-academy`. Nothing derives one from the other — the names come from
weaver's `friends.json` and nowhere else.

## Licence

MIT.
