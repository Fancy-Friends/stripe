# GENERATED FILE — do not edit.
#
# Emitted from provider/actions/refund-create.json by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/actions/refund-create.json (or weaver's template/) and regenerate:
#
# npm run provider -- stripe

"""Refund a Stripe payment, in full or in part.

POST /v1/refunds — https://docs.stripe.com/api/refunds/create

This describes the request. `call` resolves the connection, picks the
estate, and either calls Stripe or calls the faker.
"""

from __future__ import annotations

from typing import Any

from .._runtime import CallResult, ConnectorConfigError, Mode, call
from ..service import descriptor

OPERATION = "refund_create"
METHOD = "POST"
PATH = "/v1/refunds"
SIDE_EFFECTS = "unsafe-to-replay"


def body(config: dict[str, Any]) -> dict[str, Any]:
    """Build the form body for one call, failing loudly and specifically."""
    if config.get("paymentIntent") is None or config.get("paymentIntent") == "":
        raise ConnectorConfigError(
            "refund_create: \"paymentIntent\" is required (Payment intent)."
        )

    amount = config.get("amount")
    if amount is not None and amount != "":
        try:
            _n = float(amount)
        except (TypeError, ValueError):
            _n = None
        if _n is None or _n != int(_n) or _n < 1:
            raise ConnectorConfigError(
                "refund_create: \"amount\" must be a positive whole number in the currency's "
                "smallest unit (1000 = $10.00), or empty for a full refund, got "
                f"{amount!r}."
            )

    out: dict[str, Any] = {}
    _value = config.get("paymentIntent")
    if _value is None or _value == "":
        raise ConnectorConfigError("refund_create: \"paymentIntent\" is required.")

    out["payment_intent"] = str(_value)
    _value = config.get("amount")
    if _value is not None and _value != "":
        out["amount"] = int(float(_value))
    _value = config.get("reason")
    if _value is not None and _value != "":
        out["reason"] = str(_value)
    out.update(_metadata_form(config.get("metadata")))

    return out


def refund_create(
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
    """Refund a Stripe payment, in full or in part."""
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
