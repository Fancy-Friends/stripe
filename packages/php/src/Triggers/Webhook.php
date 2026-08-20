<?php

declare(strict_types=1);

namespace ParticleAcademy\Stripe\Triggers;

use ParticleAcademy\Connectors\DeliveryMechanism;
use ParticleAcademy\Connectors\WebhookVerifier;

/*
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/triggers/webhook.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/triggers/webhook.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */
/**
 * Stripe's webhook trigger — the delivery contract.
 *
 * Kept beside the service descriptor rather than inside a node, because a
 * signature scheme is a fact about STRIPE. The twin of the js package's
 * trigger module.
 */
final class Webhook
{
    public const OPERATION = 'webhook';
    public const DELIVERY = DeliveryMechanism::Webhook;

    public const SETUP = 'Add an endpoint in the Stripe dashboard (or via POST /v1/webhook_endpoints) pointing at the route your host mounts for this trigger, then put the endpoint\'s signing secret on the connection as `webhookSecret`.';

    /** Header carrying the signature. */
    public const SIGNATURE_HEADER = 'Stripe-Signature';

    /** The provider's documented replay window, in seconds. */
    public const TOLERANCE = 300;

    /** The credential holding the signing secret. */
    public const SECRET_CREDENTIAL = 'webhookSecret';

    /**
     * Split `t=…,v1=…` into its parts.
     *
     * Stripe packs the timestamp INTO the signature header (`t=…,v1=…`) rather
     * than sending one of its own. Several `v1` values arrive during a secret
     * rotation; the FIRST is taken, because failing over to a second makes "which
     * one matched" ambiguous for a window that is rare and short.
     *
     * @return array{signature: ?string, timestamp: ?string}
     */
    public static function parseSignature(string $raw): array
    {
        $result = ['signature' => null, 'timestamp' => null];

        foreach (explode(',', $raw) as $part) {
            $pair = explode('=', trim($part), 2);
            if (count($pair) !== 2) {
                continue;
            }

            if ($pair[0] === 't') {
                $result['timestamp'] = $pair[1];
            }
            if ($pair[0] === 'v1' && $result['signature'] === null) {
                $result['signature'] = $pair[1];
            }
        }

        return $result;
    }

    /** The exact bytes Stripe signs. */
    public static function signedPayload(string $raw, ?string $timestamp): string
    {
        return ($timestamp ?? '').'.'.$raw;
    }

    /**
     * Verify one inbound Stripe delivery.
     *
     * The host calls this BEFORE starting a run, with the body exactly as
     * received. Re-serialised JSON changes key order and whitespace and produces a
     * mismatch that looks precisely like a wrong secret — hours spent debugging
     * the wrong thing.
     *
     * @param array<string,string|list<string>> $headers
     * @return array{ok: bool, reason: ?string}
     */
    public static function verifyDelivery(
        string $raw,
        array $headers,
        ?string $webhookSecret,
        ?int $now = null,
    ): array {
        $header = WebhookVerifier::header($headers, self::SIGNATURE_HEADER);
        $parsed = $header === null
            ? ['signature' => null, 'timestamp' => null]
            : self::parseSignature($header);

        return WebhookVerifier::verify(
            raw: $raw,
            signature: $parsed['signature'],
            secret: $webhookSecret,
            payload: self::signedPayload(...),
            algorithm: 'sha256',
            tolerance: self::TOLERANCE,
            timestamp: $parsed['timestamp'],
            now: $now,
        );
    }
}
