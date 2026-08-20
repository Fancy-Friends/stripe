# Changelog — Stripe

All four packages — `@particle-academy/stripe-ui`, `@particle-academy/stripe-js`, `particle-academy/stripe-php` and `fancy-stripe` —
are released together under one version. They are generated from one
`provider/` definition, so a change to it changes all four, and separate
version lines would only record which of the four somebody remembered to bump.

**A release with no entry here is refused at tag time.** `publish.yml` checks
before it builds anything, so the failure costs seconds rather than a
half-published version across three registries.

## [Unreleased]

## [0.1.0] — unreleased

### Added

- First release. Ported from the vendored flow-node connector at
  `px-ui-sandbox/resources/flow-nodes/_stripe`.
