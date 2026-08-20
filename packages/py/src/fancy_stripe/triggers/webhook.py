# GENERATED FILE — do not edit.
#
# Emitted from provider/triggers/webhook.json by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/triggers/webhook.json (or weaver's template/) and regenerate:
#
# npm run provider -- stripe

"""Stripe's webhook trigger — the delivery contract.

Kept beside the service descriptor rather than inside a node, because a
signature scheme is a fact about STRIPE.
"""

from __future__ import annotations

from typing import Any

from .._runtime import Verification, verify_hmac
from ..faker import respond
from ..service import SERVICE

OPERATION = "webhook"
DELIVERY = "webhook"
SETUP = (
    "Add an endpoint in the Stripe dashboard (or via POST /v1/webhook_endpoints) pointing at "
    "the route your host mounts for this trigger, then put the endpoint's signing secret on "
    "the connection as `webhookSecret`."
)
SIGNATURE_HEADER = "Stripe-Signature"
ALGORITHM = "sha256"
SIGNATURE_ENCODING = "hex"

# The provider's documented replay window, in seconds.
TOLERANCE = 300

# WHICH credential holds the signing secret — a field name, not a secret.
# S105 reads any string assigned to a *_CREDENTIAL name as a hardcoded
# password; here the value is the key to look up on the connection.
SECRET_CREDENTIAL = "webhookSecret"  # noqa: S105


def parse_signature(raw: str) -> tuple[str | None, str | None]:
    """Split `t=…,v1=…` into (signature, timestamp).
    
    Stripe packs the timestamp INTO the signature header (`t=…,v1=…`) rather
    than sending one of its own. Several `v1` values arrive during a secret
    rotation; the FIRST is taken, because failing over to a second makes "which
    one matched" ambiguous for a window that is rare and short.
    """
    signature: str | None = None
    timestamp: str | None = None

    for part in raw.split(","):
        pair = part.strip().split("=", 1)
        if len(pair) != 2:
            continue

        if pair[0] == "t":
            timestamp = pair[1]
        if pair[0] == "v1" and signature is None:
            signature = pair[1]

    return signature, timestamp


def signed_payload(raw: str, timestamp: str | None) -> str:
    """The exact bytes Stripe signs."""
    return f"{timestamp or ''}.{raw}"


def verify_delivery(
    raw: str,
    headers: dict[str, str],
    webhooksecret: str | None,
    now: int | None = None,
) -> Verification:
    """Verify one inbound Stripe delivery.
    
    The host calls this BEFORE starting a run, with the body exactly as
    received. Re-serialised JSON changes key order and whitespace and produces a
    mismatch that looks precisely like a wrong secret — hours of debugging the
    wrong thing.
    """
    header = next(
        (v for k, v in headers.items() if k.lower() == SIGNATURE_HEADER.lower()),
        None,
    )
    signature, timestamp = parse_signature(header) if header else (None, None)

    return verify_hmac(
        raw=raw,
        signature=signature,
        secret=webhooksecret,
        payload=signed_payload,
        algorithm=ALGORITHM,
        encoding=SIGNATURE_ENCODING,
        tolerance=TOLERANCE,
        timestamp=timestamp,
        now=now,
    )


def sample_event(config: dict[str, Any] | None = None) -> Any:
    """A faked sample event, so the trigger is runnable before any of the setup
    above.
    
    An author can see the real field names and wire the downstream nodes against
    them before the provider has ever been contacted.
    """
    from .._fake import FakeValues, seed_for_call

    resolved = config or {}
    fake = FakeValues(seed_for_call(SERVICE, OPERATION, resolved))

    return respond(OPERATION, {"config": resolved, "fake": fake})
