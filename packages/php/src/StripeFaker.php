<?php

declare(strict_types=1);

namespace ParticleAcademy\Stripe;

use ParticleAcademy\Connectors\FakeRequest;

/*
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/fixtures/ by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/fixtures/ (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */
/**
 * The Stripe faker — the PHP twin of the js package's `src/faker.ts`.
 *
 * Bit-for-bit identical: the same FNV-1a seed and the same xorshift32
 * sequence, so a golden fixture asserts the exact faked payload and BOTH
 * runtimes have to produce it. That turns the faker into a parity test rather
 * than a convenience.
 */
final class StripeFaker
{
    /** @param array<string,mixed> $request */
    public static function respond(string $operation, array $request): mixed
    {
        /** @var array<string,mixed> $config */
        $config = $request['config'] ?? [];
        /** @var FakeValuesLike $fake */
        $fake = $request['fake'];

        return match ($operation) {
            'customer_create' => self::CustomerCreate($config, $fake),
            'payment_intent_create' => self::PaymentIntentCreate($config, $fake),
            'refund_create' => self::RefundCreate($config, $fake),
            'webhook' => self::Webhook($config, $fake),
            default => throw new \InvalidArgumentException(
                // A faker asked for an operation it has no shape for must SAY so.
                // Making something up would produce a green run whose output
                // silently has none of the fields the author is about to reference.
                'stripe: no fake response is defined for "'.$operation.'". '
                    .'Add a fixture under provider/fixtures/ and regenerate — a connector without a faker '
                    .'cannot be developed against, tested, or demonstrated.'
            ),
        };
    }

    /** @param array<string,mixed> $config */
    private static function CustomerCreate(array $config, mixed $fake): array
    {
        return [
        'id' => $fake->id('cus'),
        'object' => 'customer',
        'email' => ((($v = $config['email'] ?? null) !== null && $v !== '') ? (string) $v : 'ada@example.test'),
        'name' => ((($v = $config['name'] ?? null) !== null && $v !== '') ? (string) $v : null),
        'created' => 1767225600,
        'livemode' => false,
    ];
    }

    /** @param array<string,mixed> $config */
    private static function PaymentIntentCreate(array $config, mixed $fake): array
    {
        return (static function () use ($config, $fake): array {
        $out = [];
        $out['id'] = $fake->id('pi');
        $out['object'] = 'payment_intent';
        $out['amount'] = ((($v = $config['amount'] ?? null) !== null && $v !== '') ? (int) $v : $fake->int(500, 25000));
        $out['amount_received'] = $out['amount'];
        $out['currency'] = ((($v = $config['currency'] ?? null) !== null && $v !== '') ? (string) $v : 'usd');
        $out['customer'] = ((($v = $config['customer'] ?? null) !== null && $v !== '') ? (string) $v : null);
        $out['description'] = ((($v = $config['description'] ?? null) !== null && $v !== '') ? (string) $v : null);
        $out['status'] = 'succeeded';
        $out['livemode'] = false;
        $out['created'] = 1767225600;
        $out['latest_charge'] = $fake->id('ch');
        $out['receipt_email'] = ((($v = $config['receiptEmail'] ?? null) !== null && $v !== '') ? (string) $v : null);
        return $out;
    })();
    }

    /** @param array<string,mixed> $config */
    private static function RefundCreate(array $config, mixed $fake): array
    {
        return [
        'id' => $fake->id('re'),
        'object' => 'refund',
        'amount' => ((($v = $config['amount'] ?? null) !== null && $v !== '') ? (int) $v : $fake->int(500, 25000)),
        'currency' => 'usd',
        'payment_intent' => ((($v = $config['paymentIntent'] ?? null) !== null && $v !== '') ? (string) $v : $fake->id('pi')),
        'reason' => ((($v = $config['reason'] ?? null) !== null && $v !== '') ? (string) $v : null),
        'status' => 'succeeded',
        'created' => 1767225600,
    ];
    }

    /** @param array<string,mixed> $config */
    private static function Webhook(array $config, mixed $fake): array
    {
        $selected = (string) ($config['sample'] ?? 'payment_intent.succeeded');
        $variants = [
            'payment_intent.succeeded' => static fn (): array => [
            'id' => $fake->id('pi'),
            'object' => 'payment_intent',
            'amount' => 2500,
            'amount_received' => 2500,
            'currency' => 'usd',
            'status' => 'succeeded',
        ],
            'charge.refunded' => static fn (): array => [
            'id' => $fake->id('ch'),
            'object' => 'charge',
            'amount' => 2500,
            'amount_refunded' => 2500,
            'currency' => 'usd',
            'status' => 'succeeded',
            'refunded' => true,
        ],
            'checkout.session.completed' => static fn (): array => [
            'id' => $fake->id('cs'),
            'object' => 'checkout.session',
            'amount_total' => 2500,
            'currency' => 'usd',
            'status' => 'complete',
            'payment_status' => 'paid',
            'customer_email' => 'ada@example.test',
        ],
            'customer.subscription.deleted' => static fn (): array => [
            'id' => $fake->id('sub'),
            'object' => 'subscription',
            'status' => 'canceled',
            'customer' => $fake->id('cus'),
            'canceled_at' => 1767225600,
        ],
        ];
        $variant = ($variants[$selected] ?? $variants['payment_intent.succeeded'])();

        return [
        'id' => $fake->id('evt'),
        'object' => 'event',
        'type' => ((($v = $config['sample'] ?? null) !== null && $v !== '') ? (string) $v : 'payment_intent.succeeded'),
        'api_version' => '2026-01-01',
        'created' => 1767225600,
        'livemode' => false,
        'data' => [
            'object' => $variant,
        ],
    ];
    }
}
