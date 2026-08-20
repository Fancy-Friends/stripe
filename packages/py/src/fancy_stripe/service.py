# GENERATED FILE — do not edit.
#
# Emitted from provider/manifest.json by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/manifest.json (or weaver's template/) and regenerate:
#
#     npm run provider -- stripe

"""Stripe, as one service descriptor shared by every Stripe operation.

The Python twin of the js and php packages' service modules.

## The sandbox trap, written down where it is used

Stripe's test estate is selected by the KEY, not the URL -- api.stripe.com
serves both. A live key sent to a node whose mode says "sandbox" reaches the
real ledger and succeeds. Nothing in the request distinguishes them, which
is exactly why credentials sit on the connection rather than on twelve
separate nodes.
"""

from __future__ import annotations

from ._runtime import PreparedRequest, ServiceDescriptor
from .faker import respond

# The connector API version this package was GENERATED against. A literal,
# never imported: an imported constant lets an upgrade rewrite the very claim
# it exists to detect, after which the copy agrees with itself forever.
CONNECTOR_API_VERSION = 1

SERVICE = "stripe"
TITLE = "Stripe"
SANDBOX = "credential"
BASE_URLS = {
    "live": "https://api.stripe.com",
    "sandbox": "https://api.stripe.com",
}

"""Credential keys a remote call cannot proceed without."""
REQUIRES = [
    "secretKey",
]

# Retried durable runs MUST not create a second charge. This header is what
# makes `unsafe-to-replay` recoverable rather than merely forbidden.
IDEMPOTENCY_HEADER = "Idempotency-Key"


def authorize(
    credentials: dict[str, str | None],
    request: PreparedRequest,
    mode: str,
) -> None:
    """Apply Stripe's auth scheme to an outgoing request.
    
    Bearer, not Basic. Stripe accepts the key as a Basic username too, and both
    are documented, but one spelling in one place is one fewer thing to get
    subtly wrong.
    """
    request.headers["Authorization"] = f"Bearer {credentials.get("secretKey") or ""}"


def descriptor() -> ServiceDescriptor:
    """The Stripe service, for the Python runtime."""
    return ServiceDescriptor(
        service=SERVICE,
        title=TITLE,
        sandbox=SANDBOX,
        base_urls=BASE_URLS,
        requires=REQUIRES,
        authorize=authorize,
        faker=respond,
        idempotency_header=IDEMPOTENCY_HEADER,
    )
