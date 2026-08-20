# GENERATED FILE — do not edit.
#
# Emitted from provider/fixtures/ by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/fixtures/ (or weaver's template/) and regenerate:
#
# npm run provider -- stripe

"""The golden fixtures — the SAME values the TypeScript and PHP packages
assert.

Bit-for-bit identical is the claim, and this is what checks it for Python.
Cross-runtime drift does not fail loudly on its own: it completes, down one
path, with no error.
"""

import pytest

from fancy_stripe._fake import FakeValues, seed_for_call
from fancy_stripe.faker import respond


def test_customer_create_fakes_the_published_shape() -> None:
    config = {}
    fake = FakeValues(seed_for_call("stripe", "customer_create", config))

    faked = respond("customer_create", {"config": config, "fake": fake})

    assert faked == {
        "id": "cus_fake_17ed1b8c2704",
        "object": "customer",
        "email": "ada@example.test",
        "name": None,
        "created": 1767225600,
        "livemode": False,
    }


def test_payment_intent_create_fakes_the_published_shape() -> None:
    config = {
        "currency": "usd",
    }
    fake = FakeValues(seed_for_call("stripe", "payment_intent_create", config))

    faked = respond("payment_intent_create", {"config": config, "fake": fake})

    assert faked == {
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
    }


def test_refund_create_fakes_the_published_shape() -> None:
    config = {}
    fake = FakeValues(seed_for_call("stripe", "refund_create", config))

    faked = respond("refund_create", {"config": config, "fake": fake})

    assert faked == {
        "id": "re_fake_f64f4068d60b",
        "object": "refund",
        "amount": 14142,
        "currency": "usd",
        "payment_intent": "pi_fake_e67c4c2090f7",
        "reason": None,
        "status": "succeeded",
        "created": 1767225600,
    }


def test_webhook_fakes_the_published_shape() -> None:
    config = {
        "sample": "payment_intent.succeeded",
    }
    fake = FakeValues(seed_for_call("stripe", "webhook", config))

    faked = respond("webhook", {"config": config, "fake": fake})

    assert faked == {
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
    }


def test_an_operation_with_no_fixture_raises_rather_than_inventing_a_shape() -> None:
    fake = FakeValues(seed_for_call("stripe", "no_such_operation", {}))

    with pytest.raises(ValueError, match="no fake response"):
        respond("no_such_operation", {"config": {}, "fake": fake})
