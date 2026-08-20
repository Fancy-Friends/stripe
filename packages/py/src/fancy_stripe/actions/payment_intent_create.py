# GENERATED FILE — do not edit.
#
# Emitted from provider/actions/payment-intent-create.json by weaver's
# generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/actions/payment-intent-create.json (or weaver's template/) and
# regenerate:
#
# npm run provider -- stripe

"""Create a Stripe PaymentIntent — take a payment.

POST /v1/payment_intents —
https://docs.stripe.com/api/payment_intents/create

This describes the request. `call` resolves the connection, picks the
estate, and either calls Stripe or calls the faker.
"""

from __future__ import annotations

from typing import Any

from .._runtime import CallResult, ConnectorConfigError, Mode, call
from ..service import descriptor

OPERATION = "payment_intent_create"
METHOD = "POST"
PATH = "/v1/payment_intents"
SIDE_EFFECTS = "unsafe-to-replay"


def body(config: dict[str, Any]) -> dict[str, Any]:
    """Build the form body for one call, failing loudly and specifically."""
    amount = config.get("amount")
    if amount is not None and amount != "":
        try:
            _n = float(amount)
        except (TypeError, ValueError):
            _n = None
        if _n is None or _n != int(_n) or _n < 1:
            raise ConnectorConfigError(
                "payment_intent_create: \"amount\" must be a positive whole number in the "
                "currency's smallest unit (1000 = $10.00), got "
                f"{amount!r}."
            )
    else:
        raise ConnectorConfigError(
            "payment_intent_create: \"amount\" is required (Amount)."
        )

    out: dict[str, Any] = {}
    _value = config.get("amount")
    if _value is None or _value == "":
        raise ConnectorConfigError("payment_intent_create: \"amount\" is required.")

    out["amount"] = int(float(_value))
    _value = config.get("currency")
    out["currency"] = str(_value).lower() if _value is not None and _value != "" else "usd"
    _value = config.get("customer")
    if _value is not None and _value != "":
        out["customer"] = str(_value)
    _value = config.get("description")
    if _value is not None and _value != "":
        out["description"] = str(_value)
    _value = config.get("receiptEmail")
    if _value is not None and _value != "":
        out["receipt_email"] = str(_value)
    out.update(_metadata_form(config.get("metadata")))

    return out


def payment_intent_create(
    config: dict[str, Any],
    *,
    credentials: dict[str, str | None] | None = None,
    mode: Mode = "auto",
    connection_id: str | None = None,
    # Derived from the run and the step, never fresh. A retried durable run must
    # send the same key or Stripe creates a second one.
    idempotency_key: str | None = None,
    attempts: int = 3,
) -> CallResult:
    """Create a Stripe PaymentIntent — take a payment."""
    return call(
        descriptor(),
        operation=OPERATION,
        method=METHOD,
        path=PATH,
        form=body(config),
        config=config,
        credentials=credentials,
        mode=mode,
        connection_id=connection_id,
        idempotency_key=idempotency_key,
        attempts=attempts,
    )


def _metadata_form(value: Any) -> dict[str, str]:
    """`{"order_id": "7"}` -> `{"metadata[order_id]": "7"}`."""
    if not isinstance(value, dict):
        return {}

    form: dict[str, str] = {}
    for key, item in value.items():
        if item is not None and item != "":
            form[f"metadata[{key}]"] = str(item)

    return form
