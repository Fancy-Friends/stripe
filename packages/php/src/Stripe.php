<?php

declare(strict_types=1);

namespace ParticleAcademy\Stripe;

use ParticleAcademy\Connectors\Mode;
use ParticleAcademy\Connectors\PreparedRequest;
use ParticleAcademy\Connectors\SandboxKind;
use ParticleAcademy\Connectors\ServiceDescriptor;

/*
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/manifest.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/manifest.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */
/**
 * Stripe, as one service descriptor shared by every Stripe operation.
 *
 * The PHP twin of the js package's `src/service.ts`.
 *
 * ## The sandbox trap, written down where it is used
 *
 * Stripe's test estate is selected by the KEY, not the URL -- api.stripe.com
 * serves both. A live key sent to a node whose mode says "sandbox" reaches the
 * real ledger and succeeds. Nothing in the request distinguishes them, which
 * is exactly why credentials sit on the connection rather than on twelve
 * separate nodes.
 */
final class Stripe
{
    // The connector API version this package was GENERATED against. A
    // literal, never imported: an imported constant lets an upgrade rewrite
    // the very claim it exists to detect.
    public const CONNECTOR_API_VERSION = 1;

    public const SERVICE = 'stripe';

    public const LIVE_URL = 'https://api.stripe.com';
    public const SANDBOX_URL = 'https://api.stripe.com';

    // Retried durable runs MUST not create a second charge. This header is
    // what makes `unsafe-to-replay` recoverable rather than merely
    // forbidden.
    public const IDEMPOTENCY_HEADER = 'Idempotency-Key';

    /** @var list<string> Credential keys a remote call cannot proceed without. */
    public const REQUIRES = [
        'secretKey',
    ];

    public static function descriptor(): ServiceDescriptor
    {
        return new ServiceDescriptor(
            service: self::SERVICE,
            title: 'Stripe',
            sandbox: SandboxKind::Credential,
            baseUrls: [
                Mode::Live->value => self::LIVE_URL,
                Mode::Sandbox->value => self::SANDBOX_URL,
            ],
            requires: self::REQUIRES,
            authorize: self::authorize(...),
            faker: StripeFaker::respond(...),
            idempotencyHeader: self::IDEMPOTENCY_HEADER,
        );
    }

    /**
     * Apply Stripe's auth scheme to an outgoing request.
     *
     * Bearer, not Basic. Stripe accepts the key as a Basic username too, and both
     * are documented, but one spelling in one place is one fewer thing to get
     * subtly wrong.
     *
     * @param array<string,string> $credentials
     */
    public static function authorize(array $credentials, PreparedRequest $request, Mode $mode): void
    {
        $request->withHeader('Authorization', 'Bearer '.($credentials['secretKey'] ?? ''));
    }
}
