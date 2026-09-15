# GENERATED FILE — do not edit.
#
# Emitted from provider/manifest.json (via weaver's
# template/embed/py/_runtime.py) by weaver's generator.
# A hand-edit here is destroyed by the next protocol sync, which is worse than
# being rejected, because it works until it silently does not. Fix
# provider/manifest.json (via weaver's template/embed/py/_runtime.py) (or
# weaver's template/) and regenerate:
#
# npm run provider -- stripe

"""The minimum connector runtime, in the standard library only.

PROVENANCE — read before editing.

This is the SINGLE SOURCE for the Python connector runtime, and it is
deliberately much smaller than ``@particle-academy/fancy-connector-core``. It
exists because that package has a TypeScript implementation and a PHP twin and
**no Python twin at all**. Every generated ``fancy-<provider>`` package carries
a copy emitted from this file, and ``new-provider.mjs --check`` fails CI when a
copy differs.

The permanent fix is a Python ``fancy-connector-core``. When it exists, this
file becomes a re-export and every provider picks it up on the next protocol
sync.

## What it does, and what it deliberately does not

It owns the WIRE: the estate, the auth placement, one call path, the faker
branch, an idempotency header, and HMAC delivery verification.

It owns NO GATE. Approval, liveness, consent, second review and every journal
belong to the host, because each is enforced in ONE place and every connector
inherits it from the dispatch path rather than implementing it.

Three properties that are asserted rather than promised:

- **Nothing here reads the environment.** Credentials are arguments. A package
  that reached for ``os.environ`` would bypass the host's discipline entirely.
- **Nothing here retries an ambiguous failure.** A request that may or may not
  have arrived is repeated only when the caller has said repeating it is
  harmless.
- **Nothing here phones home.** No telemetry, no central service, and no URL
  this module contacts that the connector did not name.

## Zero dependencies is a constraint, not an accident

``urllib`` for HTTP, ``hmac``/``hashlib`` for signatures. A vendor SDK is
third-party code subject to the kit's full approval bar, and one SDK per
provider is hundreds of dependencies nobody is tracking.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Literal

Mode = Literal["fake", "sandbox", "live", "auto"]


class ConnectorError(Exception):
    """Something went wrong talking to the provider."""

    def __init__(self, message: str, *, status: int | None = None, retryable: bool = False) -> None:
        super().__init__(message)
        self.status = status
        #: Whether repeating this exact request is known to be harmless. Defaults
        #: to False: an ambiguous failure is only retryable when the caller said
        #: so, not when a retry would be convenient.
        self.retryable = retryable


class ConnectorConfigError(ConnectorError):
    """The call was refused before anything was sent. Nothing was attempted."""


class ConnectorAuthError(ConnectorError):
    """The provider rejected the credential."""


class ConnectorModeError(ConnectorError):
    """The requested estate does not exist for this provider."""


@dataclass
class PreparedRequest:
    """An outgoing request, after the service descriptor has authorised it."""

    method: str
    url: str
    headers: dict[str, str] = field(default_factory=dict)
    query: dict[str, str] = field(default_factory=dict)
    body: bytes | None = None


@dataclass
class ServiceDescriptor:
    """A provider, as one value shared by every one of its operations."""

    service: str
    title: str
    sandbox: str
    base_urls: dict[str, str]
    requires: list[str]
    authorize: Callable[[dict[str, str | None], PreparedRequest, str], None]
    faker: Callable[[str, dict[str, Any]], Any]
    idempotency_header: str | None = None


@dataclass
class CallResult:
    """What one call produced, and which estate produced it."""

    mode: str
    connection: str | None
    data: Any
    status: int | None = None


@dataclass
class Verification:
    """Whether an inbound delivery can be trusted, and why not when it cannot."""

    ok: bool
    reason: str | None = None


#: The estate kinds a ``sandbox`` mode can actually point at. Mirrors the
#: TypeScript ``sandboxIsSelectable``.
SELECTABLE_SANDBOX = ("credential", "base-url", "separate-account")


def resolve_mode(descriptor: ServiceDescriptor, requested: Mode) -> str:
    """Turn ``auto`` into a real estate, and refuse one the provider does not have.

    A provider with no sandbox resolving ``sandbox`` to ``live`` would be the
    worst possible reading: it moves real money while the caller believes it did
    not.
    """
    if requested == "auto":
        return "fake"

    if requested == "sandbox" and descriptor.sandbox not in SELECTABLE_SANDBOX:
        raise ConnectorModeError(
            f'{descriptor.service}: sandbox was requested but this provider\'s estate is '
            f'"{descriptor.sandbox}", which cannot be selected. Use "fake" to design against '
            f'a shaped response, or "live" deliberately.'
        )

    return requested


def call(
    descriptor: ServiceDescriptor,
    *,
    operation: str,
    method: str,
    path: str,
    form: dict[str, Any] | None = None,
    json_body: Any | None = None,
    query: dict[str, Any] | None = None,
    config: dict[str, Any] | None = None,
    credentials: dict[str, str | None] | None = None,
    mode: Mode = "auto",
    connection_id: str | None = None,
    idempotency_key: str | None = None,
    idempotent: bool = False,
    attempts: int = 3,
    timeout: float = 30.0,
    transport: Callable[[PreparedRequest], tuple[int, str]] | None = None,
) -> CallResult:
    """Make one call, or fake one.

    ``fake`` mode never touches the network, so a connector is runnable before an
    account, a key or a provider that is up.
    """
    resolved = resolve_mode(descriptor, mode)
    config = config or {}

    if resolved == "fake":
        from ._fake import FakeValues, seed_for_call

        fake = FakeValues(seed_for_call(descriptor.service, operation, config))

        return CallResult(
            mode="fake",
            connection=connection_id,
            data=descriptor.faker(operation, {"config": config, "fake": fake}),
        )

    base = descriptor.base_urls.get(resolved)
    if not base:
        raise ConnectorModeError(f"{descriptor.service}: no base URL for mode \"{resolved}\".")

    credentials = credentials or {}
    missing = [key for key in descriptor.requires if not credentials.get(key)]
    if missing:
        raise ConnectorConfigError(
            f"{descriptor.service}: the connection is missing {', '.join(missing)}."
        )

    request = PreparedRequest(method=method, url=base.rstrip("/") + path)
    request.query = {k: str(v) for k, v in (query or {}).items() if v is not None}

    if form is not None:
        request.body = urllib.parse.urlencode(
            {k: v for k, v in form.items() if v is not None}, doseq=False
        ).encode()
        request.headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif json_body is not None:
        request.body = json.dumps(json_body, separators=(",", ":")).encode()
        request.headers["Content-Type"] = "application/json"

    if idempotency_key and descriptor.idempotency_header:
        request.headers[descriptor.idempotency_header] = idempotency_key

    descriptor.authorize(credentials, request, resolved)

    send = transport or _urllib_transport
    last: ConnectorError | None = None

    for attempt in range(1, max(1, attempts) + 1):
        try:
            status, text = send(_with_query(request, timeout))
        except OSError as error:  # DNS, connection reset, timeout
            # Nobody can tell whether this arrived. Repeating is safe only when
            # the caller has said so or the request carries an idempotency key.
            last = ConnectorError(
                f"{descriptor.service}: {operation} did not complete ({error}).",
                retryable=idempotent or bool(idempotency_key),
            )
        else:
            if 200 <= status < 300:
                return CallResult(
                    mode=resolved,
                    connection=connection_id,
                    data=json.loads(text) if text else None,
                    status=status,
                )

            last = _classify(descriptor.service, operation, status, text)

        if not last.retryable or attempt == attempts:
            raise last

        time.sleep(min(2 ** (attempt - 1), 8))

    raise last if last else ConnectorError(f"{descriptor.service}: {operation} failed.")


def _with_query(request: PreparedRequest, timeout: float) -> PreparedRequest:
    if not request.query:
        return request

    separator = "&" if "?" in request.url else "?"
    joined = PreparedRequest(
        method=request.method,
        url=f"{request.url}{separator}{urllib.parse.urlencode(request.query)}",
        headers=dict(request.headers),
        body=request.body,
    )
    joined.headers.setdefault("_timeout", str(timeout))

    return joined


def _urllib_transport(request: PreparedRequest) -> tuple[int, str]:
    timeout = float(request.headers.pop("_timeout", "30"))
    raw = urllib.request.Request(  # noqa: S310 — the URL comes from the descriptor
        request.url,
        data=request.body,
        headers=request.headers,
        method=request.method,
    )

    try:
        with urllib.request.urlopen(raw, timeout=timeout) as response:  # noqa: S310
            return response.status, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", "replace")


def _classify(service: str, operation: str, status: int, body: str) -> ConnectorError:
    """Separate "it was refused" from "nobody can tell"."""
    message = f"{service}: {operation} failed with {status}. {body[:400]}"

    if status in (401, 403):
        return ConnectorAuthError(message, status=status)
    if status == 429 or status >= 500:
        # A 5xx or a rate limit is the provider saying "try again", which is a
        # different fact from a 4xx saying "this request is wrong".
        return ConnectorError(message, status=status, retryable=True)

    return ConnectorError(message, status=status)


_ALGORITHMS = {"sha256": hashlib.sha256, "sha1": hashlib.sha1, "sha512": hashlib.sha512}


def verify_hmac(
    *,
    raw: str,
    signature: str | list[str] | None,
    secret: str | None,
    payload: Callable[..., str],
    algorithm: str,
    encoding: str = "hex",
    tolerance: int | None = None,
    timestamp: str | None = None,
    now: int | None = None,
    secret_encoding: str = "utf8",  # noqa: S107 — how the secret is SPELLED, not one
    secret_prefix: str | None = None,
    id: str | None = None,
) -> Verification:
    """Verify one inbound delivery.

    Refuses rather than accepts on every missing input. That asymmetry is the
    whole safety property: an unverifiable endpoint is a stranger's button for
    starting workflows in your account, and defaulting to "allow" would make
    every misconfiguration into an open door that looks shut.

    ``raw`` must be the body EXACTLY as received. Re-serialised JSON changes key
    order and whitespace and produces a mismatch that looks precisely like a
    wrong secret.

    ``secret_encoding`` says how the SECRET is spelled: ``utf8`` (the default,
    every provider before Svix — the key is the text's bytes) or ``base64``
    (the key is the DECODED bytes; Svix's ``whsec_<base64>``, half of whose
    bytes are not UTF-8). ``secret_prefix`` is stripped first, and its absence
    is a refusal, never a guess.
    """
    if not secret:
        return Verification(False, "no signing secret is configured for this connection")

    # A LIST when the provider sends several — Stripe signs once per active
    # secret while a secret is rolled, Svix's header "could be any number of
    # signatures" — and the delivery is accepted when ANY matches. A first-only
    # rule fails every delivery whose first signature came from the new secret.
    offered = signature if isinstance(signature, list) else [signature]
    candidates = [s for s in offered if isinstance(s, str) and s]
    if not candidates:
        return Verification(False, "the delivery carried no signature")

    digest = _ALGORITHMS.get(algorithm)
    if digest is None:
        return Verification(False, f'unsupported signature algorithm "{algorithm}"')

    # The key is checked BEFORE anything is signed, so a secret that cannot be
    # a key is named as such rather than producing a mismatch that reads like a
    # wrong secret.
    key = _secret_key_bytes(secret, secret_encoding, secret_prefix)
    if isinstance(key, Verification):
        return key

    if tolerance is not None:
        if not timestamp:
            return Verification(
                False, "the delivery carried no timestamp, and this scheme signs one"
            )
        try:
            sent = int(float(timestamp))
        except (TypeError, ValueError):
            return Verification(False, f'the delivery timestamp "{timestamp}" is not a number')

        current = int(time.time()) if now is None else now
        if abs(current - sent) > tolerance:
            return Verification(
                False,
                f"the delivery is outside the {tolerance}s replay window "
                f"({abs(current - sent)}s old)",
            )

    # A payload that signs the delivery's ID (Svix) takes it as a third argument;
    # the two-argument payloads every earlier scheme wrote are called as before.
    signed = payload(raw, timestamp) if id is None else payload(raw, timestamp, id)
    computed = hmac.new(key, signed.encode(), digest)
    expected = computed.hexdigest() if encoding == "hex" else _b64(computed.digest())

    # Constant time per candidate, so a signature cannot be discovered one
    # character at a time; which candidate matched is not a secret.
    if not any(hmac.compare_digest(expected, candidate) for candidate in candidates):
        return Verification(False, "the signature does not match")

    return Verification(True)


def _secret_key_bytes(
    secret: str,
    secret_encoding: str = "utf8",  # noqa: S107 — how the secret is SPELLED, not one
    secret_prefix: str | None = None,
) -> bytes | Verification:
    """The HMAC key a scheme's secret spells, or the refusal it earns."""
    import base64
    import binascii
    import json
    import re

    material = secret
    if secret_prefix is not None:
        if not material.startswith(secret_prefix):
            return Verification(
                False, f"signing secret does not start with {json.dumps(secret_prefix)}"
            )
        material = material[len(secret_prefix) :]

    if secret_encoding == "base64":  # noqa: S105 — a spelling, not a password
        # Strict: a lenient decode of a KEY is a key nobody can reason about.
        well_formed = re.fullmatch(r"[A-Za-z0-9+/]*={0,2}", material) is not None
        if not material or len(material) % 4 != 0 or not well_formed:
            return Verification(False, "signing secret is not valid base64")
        try:
            return base64.b64decode(material, validate=True)
        except (binascii.Error, ValueError):
            return Verification(False, "signing secret is not valid base64")

    return material.encode()


def verify_shared_token(
    *,
    raw: str,
    headers: dict[str, str],
    secret: str | None,
    placement: str,
    name: str,
) -> Verification:
    """Verify a delivery by a token the provider ECHOES rather than a signature it computes.

    Google Calendar sends the channel's ``token`` back in ``X-Goog-Channel-Token``
    on every notification — with an EMPTY body, so there is nothing to sign.
    Microsoft Graph sends ``clientState`` inside every item of the
    notification's ``value`` array. Same refusal-by-default as ``verify_hmac``,
    same result shape, and a constant-time comparison: a token is a secret.

    ``placement`` is ``header`` (then ``name`` is the header) or ``body`` (then
    ``name`` is a dotted path into the JSON body; a segment ending in ``[]``
    means EVERY element of that array, all of which must match — one wrong item
    refuses the whole delivery). The reasons are the connector core's exact
    strings, so a host logs the same words whichever runtime answered.
    """
    if not secret:
        return Verification(False, "no shared token configured for this trigger")

    tokens: list[Any]
    if placement == "header":
        tokens = [next((v for k, v in headers.items() if k.lower() == name.lower()), None)]
    else:
        try:
            parsed = json.loads(raw)
        except ValueError:
            return Verification(False, "delivery body is not JSON")
        tokens = _read_tokens(parsed, name.split("."))

    present = [t for t in tokens if t is not None and t != ""]
    if not present:
        return Verification(False, "delivery carried no token")

    # Every element is compared, none is skipped: a batch is accepted as a whole
    # or refused as a whole.
    matched = len(present) == len(tokens)
    for token in present:
        matched = (isinstance(token, str) and hmac.compare_digest(secret, token)) and matched

    return Verification(True) if matched else Verification(False, "token did not match")


def _read_tokens(value: Any, segments: list[str]) -> list[Any]:
    """Every value at a dotted path; a ``[]`` segment fans out over a list. Absent is None."""
    if not segments:
        return [value]

    head, rest = segments[0], segments[1:]
    each_element = head.endswith("[]")
    key = head[:-2] if each_element else head

    if not isinstance(value, dict) or key not in value:
        return [None]
    nxt = value[key]

    if not each_element:
        return _read_tokens(nxt, rest)
    if not isinstance(nxt, list):
        return [None]

    found: list[Any] = []
    for element in nxt:
        found.extend(_read_tokens(element, rest))

    return found


def handshake_response(
    param: str | None, query: dict[str, str | list[str]], content_type: str = "text/plain"
) -> dict[str, Any] | None:
    """Answer a provider's challenge — Graph POSTs ``?validationToken=…`` when a
    subscription is created and refuses to create it unless the token comes
    back, decoded, as ``text/plain``. The pure half: what to send, or None when
    the request is not a challenge at all (no parameter, an empty one, or a
    trigger that declares no handshake). ``query`` is already URL-decoded by
    the framework.
    """
    if param is None:
        return None

    raw = query.get(param)
    token = raw[0] if isinstance(raw, list) and raw else raw
    if not token or isinstance(token, list):
        return None

    return {"status": 200, "contentType": content_type, "body": token}


def _b64(raw: bytes) -> str:
    import base64

    return base64.b64encode(raw).decode()
