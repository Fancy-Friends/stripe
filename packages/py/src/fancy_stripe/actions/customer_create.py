# GENERATED FILE — do not edit.
#
# Emitted from provider/actions/customer-create.json by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/actions/customer-create.json (or weaver's template/) and regenerate:
#
#     npm run provider -- stripe

"""Create a Stripe customer.

POST /v1/customers — https://docs.stripe.com/api/customers/create

This describes the request. `call` resolves the connection, picks the
estate, and either calls Stripe or calls the faker.
"""

from __future__ import annotations

from typing import Any

from .._runtime import CallResult, ConnectorConfigError, call
from ..service import descriptor

OPERATION = "customer_create"
METHOD = "POST"
PATH = "/v1/customers"
SIDE_EFFECTS = "unsafe-to-replay"


def body(config: dict[str, Any]) -> dict[str, Any]:
    """Build the form body for one call, failing loudly and specifically."""
    if config.get("email") is None or config.get("email") == "":
        raise ConnectorConfigError(
            'customer_create: "email" is required (Email).'
        )

    out: dict[str, Any] = {}
    _value = config.get("email")
    out["email"] = str(_value).strip()
    _value = config.get("name")
    if _value is not None and _value != "":
        out["name"] = str(_value)
    _value = config.get("phone")
    if _value is not None and _value != "":
        out["phone"] = str(_value)
    out.update(_metadata_form(config.get("metadata")))

    return out


def customer_create(
    config: dict[str, Any],
    *,
    credentials: dict[str, str | None] | None = None,
    mode: str = "auto",
    connection_id: str | None = None,
    # Derived from the run and the step, never fresh. A retried durable run must
    # send the same key or Stripe creates a second one.
    idempotency_key: str | None = None,
    attempts: int = 3,
) -> CallResult:
    """Create a Stripe customer."""
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
