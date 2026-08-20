# GENERATED FILE — do not edit.
#
# Emitted from provider/manifest.json by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/manifest.json (or weaver's template/) and regenerate:
#
#     npm run provider -- stripe

"""Stripe for Python.

The service descriptor, its faker, its delivery contract, and one function
per operation — plain HTTP on the stdlib, no vendor SDK and no runtime
dependency.
"""

from __future__ import annotations

from ._fake import FakeValues
from .faker import respond
from .service import CONNECTOR_API_VERSION, BASE_URLS, REQUIRES, SANDBOX, SERVICE, TITLE, descriptor
from .actions.customer_create import customer_create
from .actions.payment_intent_create import payment_intent_create
from .actions.refund_create import refund_create
from .triggers import webhook

__version__ = "0.1.0"

__all__ = [
    "CONNECTOR_API_VERSION",
    "BASE_URLS",
    "REQUIRES",
    "SANDBOX",
    "SERVICE",
    "TITLE",
    "FakeValues",
    "descriptor",
    "respond",
    "customer_create",
    "payment_intent_create",
    "refund_create",
    "webhook",
]
