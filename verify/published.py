"""
Stripe — the published PyPI wheel.

GENERATED — do not edit. Fix weaver's template/ and regenerate.

Runs against the PUBLISHED wheel, installed by name into a fresh venv.
Every other test here imports from ../src and cannot see the packaging —
a missing py.typed or an unshipped module passes there and breaks for
every user.
"""

from importlib.metadata import requires

from fancy_stripe._fake import FakeValues, seed_for_call
from fancy_stripe.faker import respond

GOLDENS = [
    {
        "operation": "customer_create",
        "config": {},
        "expected": {
            "id": "cus_fake_17ed1b8c2704",
            "object": "customer",
            "email": "ada@example.test",
            "name": None,
            "created": 1767225600,
            "livemode": False,
        },
    },
    {
        "operation": "payment_intent_create",
        "config": {
            "currency": "usd",
        },
        "expected": {
            "id": "pi_fake_303f74a80be9",
            "object": "payment_intent",
            "amount": 19569,
            "amount_received": 19569,
            "currency": "usd",
            "customer": None,
            "description": None,
            "status": "succeeded",
            "livemode": False,
            "created": 1767225600,
            "latest_charge": "ch_fake_00cc67960be2",
            "receipt_email": None,
        },
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
            "reason": None,
            "status": "succeeded",
            "created": 1767225600,
        },
    },
    {
        "operation": "webhook",
        "config": {
            "sample": "payment_intent.succeeded",
        },
        "expected": {
            "id": "evt_fake_80bf44d16c8f",
            "object": "event",
            "type": "payment_intent.succeeded",
            "api_version": "2026-01-01",
            "created": 1767225600,
            "livemode": False,
            "data": {
                "object": {
                    "id": "pi_fake_4f2fc32a5e11",
                    "object": "payment_intent",
                    "amount": 2500,
                    "amount_received": 2500,
                    "currency": "usd",
                    "status": "succeeded",
                },
            },
        },
    },
]


def main() -> None:
    # Zero runtime dependencies is a design constraint, checked on the
    # INSTALLED distribution rather than on the pyproject that claimed it.
    declared = requires("fancy-stripe")
    assert not declared, f"expected no runtime dependencies, got {declared}"
    print("  ok   zero runtime dependencies on the installed distribution")

    for golden in GOLDENS:
        operation, config = golden["operation"], golden["config"]
        fake = FakeValues(seed_for_call("stripe", operation, config))
        faked = respond(operation, {"config": config, "fake": fake})

        assert faked == golden["expected"], (
            f"the PUBLISHED wheel produced different bytes for {operation} than the repo does"
        )
        print(f"  ok   {operation}")

    print(f"\n  {len(GOLDENS)} operations verified against the published wheel.")


if __name__ == "__main__":
    main()
