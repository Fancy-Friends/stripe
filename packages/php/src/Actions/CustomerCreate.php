<?php

declare(strict_types=1);

namespace ParticleAcademy\Stripe\Actions;

use ParticleAcademy\Stripe\Stripe;
use ParticleAcademy\Connectors\ConnectorConfigException;

/*
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/customer-create.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/customer-create.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */
/**
 * Create a Stripe customer.
 *
 * POST /v1/customers — https://docs.stripe.com/api/customers/create
 *
 * This describes the request. The connector client resolves the connection,
 * picks the estate, and either calls Stripe or calls the faker.
 */
final class CustomerCreate
{
    public const OPERATION = 'customer_create';
    public const METHOD = 'POST';
    public const PATH = '/v1/customers';
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
        if (($config['email'] ?? null) === null || ($config['email'] ?? null) === '') {
            throw new ConnectorConfigException('customer_create: "email" is required (Email).');
        }

        $body = [];

        $value = $config['email'] ?? null;
        $body['email'] = trim((string) $value);

        $value = $config['name'] ?? null;
        if ($value !== null && $value !== '') {
            $body['name'] = (string) $value;
        }

        $value = $config['phone'] ?? null;
        if ($value !== null && $value !== '') {
            $body['phone'] = (string) $value;
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
