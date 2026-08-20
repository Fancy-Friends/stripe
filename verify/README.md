# verify/ — the published packages

GENERATED. Fix weaver's `template/` and regenerate.

These three scripts run against the **published** artifacts, installed by name
from their registries into throwaway projects. `.github/workflows/verify-published.yml`
runs them nightly and on demand.

## Why they exist

Every other test in this repo imports from `../src`. **A package's own suite
cannot see its packaging** — a missing `files` entry, an unshipped module, an
`exports` map that does not resolve, a wheel without `py.typed`. All of those
pass a green in-repo suite and break for every consumer.

That is not hypothetical. `@particle-academy/fancy-flow` shipped its
`/engine` subpath without exporting a type its own source declared, and it
reached two marketplace nodes — because every test in that repo imports from
`src`, so none of them could ever have caught it.

## What they assert

The **same golden payloads** the in-repo suites assert, not "it imported
without throwing" — which is the assertion that catches nothing.

Because all three assert the same goldens, running them together also proves
cross-runtime parity between three **separately built, separately published**
artifacts:

| Registry | Package |
|---|---|
| npm | `@particle-academy/stripe-js` (+ `@particle-academy/stripe-ui`, resolved transitively) |
| PyPI | `fancy-stripe` |
| Packagist | `particle-academy/stripe-php` |

A disagreement between them means one runtime shipped something the others did
not — and cross-runtime drift does not fail loudly on its own. It completes,
down one path, with no error.

## Running one by hand

```bash
mkdir /tmp/check && cd /tmp/check
npm init -y && npm pkg set type=module
npm install @particle-academy/stripe-js @particle-academy/fancy-flow
node path/to/verify/published.mjs
```

The scripts deliberately take no arguments and read nothing from this repo. If
one needs a path into the working tree to pass, it is no longer testing what a
consumer gets.
