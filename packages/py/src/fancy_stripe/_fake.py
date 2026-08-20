# GENERATED FILE — do not edit.
#
# Emitted from provider/manifest.json (via weaver's template/embed/py/_fake.py) by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/manifest.json (via weaver's template/embed/py/_fake.py) (or weaver's template/) and regenerate:
#
#     npm run provider -- stripe

"""Deterministic faker values — bit-for-bit with TypeScript and PHP.

PROVENANCE — read before editing.

This is the SINGLE SOURCE for the Python faker helpers. It exists because
``fancy-connector-core`` has a TypeScript implementation and a PHP twin and
**no Python twin at all**, so a generated ``fancy-<provider>`` package has no
shared runtime to import. Every generated package carries a copy emitted from
this file, and ``new-provider.mjs --check`` fails CI when a copy differs.

The permanent fix is a Python ``fancy-connector-core``. When it exists, this
file becomes a re-export and every provider picks it up on the next protocol
sync.

## Bit-for-bit identical is the whole point

Not "similar": the same FNV-1a seed and the same xorshift32 sequence, so a
golden fixture asserts the exact faked payload and ALL THREE runtimes have to
produce it. That turns the faker into a parity test rather than a convenience —
which matters, because cross-runtime drift does not fail loudly. It completes,
down one path, with no error.

Python integers are unbounded, so every 32-bit operation is masked back into
range. Dropping one of those masks does not break anything visibly; it just
makes the runtimes diverge after a few hundred calls, which is the worst
possible way for this to fail.

## Deterministic, and obviously fake

Same inputs, same output — always. A faker returning a fresh uuid every call
cannot be asserted on, so its fixtures degrade to "it did not throw", which is
the assertion that catches nothing. And the values are obviously synthetic ON
PURPOSE — ``fake_``-prefixed ids, ``example.test`` hosts, round numbers. Nobody
should ever look at a faked result and wonder whether it moved real money.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

MASK = 0xFFFFFFFF

#: The instant every faker counts from. A constant rather than the clock,
#: because a fixture asserting on ``created`` must not start failing tomorrow.
FAKE_EPOCH = "2026-01-01T00:00:00.000Z"

_FNV_OFFSET = 0x811C9DC5
_FNV_PRIME = 0x01000193


def _stable_json(value: Any) -> str:
    """Render a value the way ``JSON.stringify`` would, with sorted object keys.

    Key order must not change a seed. ``json.dumps`` preserves insertion order,
    so ``{a, b}`` and ``{b, a}`` would hash differently and "same inputs, same
    output" would hold only for dicts that happened to be built in the same
    order — the kind of almost-true that survives review and fails in a fixture
    months later.
    """
    if isinstance(value, dict):
        parts = [
            f"{json.dumps(str(key))}:{_stable_json(item)}"
            for key, item in sorted(value.items(), key=lambda pair: str(pair[0]))
            if item is not ...
        ]
        return "{" + ",".join(parts) + "}"

    if isinstance(value, (list, tuple)):
        return "[" + ",".join(_stable_json(item) for item in value) + "]"

    # `separators` matters: JavaScript emits no spaces, and a space here would
    # change every seed.
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def seed_from(*parts: Any) -> int:
    """FNV-1a over the stable rendering of the parts. Twin of ``seedFrom``."""
    text = "|".join(part if isinstance(part, str) else _stable_json(part) for part in parts)

    hash_ = _FNV_OFFSET
    # JavaScript hashes UTF-16 code units, so a character outside the BMP
    # contributes two of them. Encoding to UTF-16-LE and reading pairs is what
    # keeps a provider name with an emoji in it seeding identically.
    for unit in _utf16_units(text):
        hash_ ^= unit
        hash_ = (hash_ * _FNV_PRIME) & MASK

    return hash_


def _utf16_units(text: str) -> list[int]:
    raw = text.encode("utf-16-le")

    return [raw[i] | (raw[i + 1] << 8) for i in range(0, len(raw), 2)]


def seed_for_call(service: str, operation: str, config: dict[str, Any] | None) -> int:
    """The seed for one faked call: service, operation, and the caller's config."""
    return seed_from(service, operation, config or {})


class FakeValues:
    """Deterministic value helpers handed to a faker.

    Small on purpose. A faker's job is to return the SHAPE the provider returns
    — the field names a downstream node will reference — not to simulate the
    provider's business logic.
    """

    def __init__(self, seed: int) -> None:
        masked = seed & MASK
        self._state = masked if masked != 0 else 0x9E3779B9

    def _next(self) -> int:
        """xorshift32, matching the JS generator step for step."""
        state = self._state
        state ^= (state << 13) & MASK
        state &= MASK
        state ^= state >> 17
        state ^= (state << 5) & MASK
        state &= MASK
        self._state = state

        return state

    def hex(self, length: int) -> str:
        """A stable lowercase hex string of ``length`` characters."""
        out = ""
        while len(out) < length:
            out += format(self._next(), "08x")

        return out[:length]

    def id(self, prefix: str) -> str:
        """A stable id with the provider's usual prefix: ``id("ch")`` -> ``ch_fake_1a2b3c``."""
        return f"{prefix}_fake_{self.hex(12)}"

    def int(self, minimum: int, maximum: int) -> int:
        """A stable integer in ``[minimum, maximum]``."""
        return minimum + (self._next() % max(1, maximum - minimum + 1))

    def pick(self, options: list[Any]) -> Any:
        """Pick a stable element of a list."""
        return options[self._next() % len(options)]

    def timestamp(self, offset_seconds: int = 0) -> str:
        """A fixed ISO-8601 instant, offset by whole seconds. Never ``now()``."""
        base = datetime(2026, 1, 1, tzinfo=UTC) + timedelta(seconds=offset_seconds)

        return base.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z"
