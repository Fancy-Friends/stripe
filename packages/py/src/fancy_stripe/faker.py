# GENERATED FILE — do not edit.
#
# Emitted from provider/fixtures/ by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/fixtures/ (or weaver's template/) and regenerate:
#
#     npm run provider -- stripe

"""The Stripe faker.

Bit-for-bit identical to the TypeScript and PHP fakers: the same FNV-1a seed
and the same xorshift32 sequence, so a golden fixture asserts the exact
faked payload and ALL THREE runtimes have to produce it. That turns the
faker into a parity test rather than a convenience — which matters, because
cross-runtime drift does not fail loudly. It completes, down one path, with
no error.
"""

from __future__ import annotations

from typing import Any

from ._fake import FakeValues


def _customer_create(config: dict[str, Any], fake: FakeValues) -> Any:
    return {
        "id": fake.id("cus"),
        "object": "customer",
        "email": (str(_v) if (_v := config.get("email")) is not None and _v != "" else "ada@example.test"),
        "name": (str(_v) if (_v := config.get("name")) is not None and _v != "" else None),
        "created": 1767225600,
        "livemode": False,
    }


def _payment_intent_create(config: dict[str, Any], fake: FakeValues) -> Any:
    out: dict[str, Any] = {}
    out["id"] = fake.id("pi")
    out["object"] = "payment_intent"
    out["amount"] = (int(float(_v)) if (_v := config.get("amount")) is not None and _v != "" else fake.int(500, 25000))
    out["amount_received"] = out["amount"]
    out["currency"] = (str(_v) if (_v := config.get("currency")) is not None and _v != "" else "usd")
    out["customer"] = (str(_v) if (_v := config.get("customer")) is not None and _v != "" else None)
    out["description"] = (str(_v) if (_v := config.get("description")) is not None and _v != "" else None)
    out["status"] = "succeeded"
    out["livemode"] = False
    out["created"] = 1767225600
    out["latest_charge"] = fake.id("ch")
    out["receipt_email"] = (str(_v) if (_v := config.get("receiptEmail")) is not None and _v != "" else None)

    return out


def _refund_create(config: dict[str, Any], fake: FakeValues) -> Any:
    return {
        "id": fake.id("re"),
        "object": "refund",
        "amount": (int(float(_v)) if (_v := config.get("amount")) is not None and _v != "" else fake.int(500, 25000)),
        "currency": "usd",
        "payment_intent": (str(_v) if (_v := config.get("paymentIntent")) is not None and _v != "" else fake.id("pi")),
        "reason": (str(_v) if (_v := config.get("reason")) is not None and _v != "" else None),
        "status": "succeeded",
        "created": 1767225600,
    }


def _webhook(config: dict[str, Any], fake: FakeValues) -> Any:
    selected = str(config.get("sample") or "payment_intent.succeeded")
    variants = {
        "payment_intent.succeeded": lambda: {
            "id": fake.id("pi"),
            "object": "payment_intent",
            "amount": 2500,
            "amount_received": 2500,
            "currency": "usd",
            "status": "succeeded",
        },
        "charge.refunded": lambda: {
            "id": fake.id("ch"),
            "object": "charge",
            "amount": 2500,
            "amount_refunded": 2500,
            "currency": "usd",
            "status": "succeeded",
            "refunded": True,
        },
        "checkout.session.completed": lambda: {
            "id": fake.id("cs"),
            "object": "checkout.session",
            "amount_total": 2500,
            "currency": "usd",
            "status": "complete",
            "payment_status": "paid",
            "customer_email": "ada@example.test",
        },
        "customer.subscription.deleted": lambda: {
            "id": fake.id("sub"),
            "object": "subscription",
            "status": "canceled",
            "customer": fake.id("cus"),
            "canceled_at": 1767225600,
        },
    }
    variant = variants.get(selected, variants["payment_intent.succeeded"])()

    return {
        "id": fake.id("evt"),
        "object": "event",
        "type": (str(_v) if (_v := config.get("sample")) is not None and _v != "" else "payment_intent.succeeded"),
        "api_version": "2026-01-01",
        "created": 1767225600,
        "livemode": False,
        "data": {
            "object": variant,
        },
    }


def respond(operation: str, request: dict[str, Any]) -> Any:
    """Dispatch to the fixture for one operation."""
    config: dict[str, Any] = request.get("config") or {}
    fake: FakeValues = request["fake"]

    if operation == "customer_create":
        return _customer_create(config, fake)

    if operation == "payment_intent_create":
        return _payment_intent_create(config, fake)

    if operation == "refund_create":
        return _refund_create(config, fake)

    if operation == "webhook":
        return _webhook(config, fake)

    # A faker asked for an operation it has no shape for must SAY so. Making
    # something up would produce a green run whose output silently has none of
    # the fields the author is about to reference.
    raise ValueError(
        f'stripe: no fake response is defined for "{operation}". '
        "Add a fixture under provider/fixtures/ and regenerate — a connector without a faker "
        "cannot be developed against, tested, or demonstrated."
    )
