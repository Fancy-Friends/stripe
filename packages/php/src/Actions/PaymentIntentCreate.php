<?php

declare(strict_types=1);

namespace ParticleAcademy\Stripe\Actions;

use ParticleAcademy\Stripe\Stripe;
use ParticleAcademy\Connectors\ConnectorConfigException;

/*
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/payment-intent-create.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/payment-intent-create.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */
/**
 * Create a Stripe PaymentIntent — take a payment.
 *
 * POST /v1/payment_intents —
 * https://docs.stripe.com/api/payment_intents/create
 *
 * This describes the request. The connector client resolves the connection,
 * picks the estate, and either calls Stripe or calls the faker.
 */
final class PaymentIntentCreate
{
    public const OPERATION = 'payment_intent_create';
    public const METHOD = 'POST';
    public const PATH = '/v1/payment_intents';
    public const SIDE_EFFECTS = 'unsafe-to-replay';

    /**
     * Build the form body for one call.
     *
     * Validation fails loudly and specifically here, rather than three frames
     * later as an "invalid request" from Stripe.
     *
     * @param array<string,mixed> $config
     * An EMPTY body is `{}`, not `[]` — and PHP cannot tell those apart, because
     * both are `array()` and `json_encode` picks the list. So an empty one is
     * returned as an object. TypeScript and Python have no such ambiguity, which
     * is why this is a difference only the byte-parity suite can see.
     *
     * @return array<string,mixed>|\stdClass
     */
    public static function body(array $config): array|\stdClass
    {
        $amount = $config['amount'] ?? null;
        if (! (is_numeric($amount) && (float) $amount === floor((float) $amount) && (float) $amount >= 1)) {
            throw new ConnectorConfigException(
                'payment_intent_create: "amount" must be a positive whole number in the currency\'s smallest unit (1000 = $10.00), got '.json_encode($amount).'.'
            );
        }

        $body = [];

        $value = $config['amount'] ?? null;
        $body['amount'] = (int) $value;

        $value = $config['currency'] ?? null;
        $body['currency'] = ($value !== null && $value !== '') ? strtolower((string) $value) : 'usd';

        $value = $config['customer'] ?? null;
        if ($value !== null && $value !== '') {
            $body['customer'] = (string) $value;
        }

        $value = $config['description'] ?? null;
        if ($value !== null && $value !== '') {
            $body['description'] = (string) $value;
        }

        $value = $config['receiptEmail'] ?? null;
        if ($value !== null && $value !== '') {
            $body['receipt_email'] = (string) $value;
        }

        foreach (self::metadataForm($config['metadata'] ?? null) as $key => $value) {
            $body[$key] = $value;
        }

        $body = $body === [] ? new \stdClass() : $body;
        return $body;
    }

    /** @return array<string,string> */
    private static function metadataForm(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $form = [];

        foreach ($value as $key => $item) {
            if ($item !== null && $item !== '') {
                $form['metadata'.'['.$key.']'] = (string) $item;
            }
        }

        return $form;
    }
}
