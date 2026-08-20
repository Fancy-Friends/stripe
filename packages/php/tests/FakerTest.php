<?php

declare(strict_types=1);

use ParticleAcademy\Stripe\StripeFaker;
use ParticleAcademy\Connectors\FakeValues;

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
 * The golden fixtures — the SAME values the TypeScript and Python packages
 * assert.
 *
 * Bit-for-bit identical is the claim, and this is what checks it.
 * Cross-runtime drift does not fail loudly on its own: it completes, down one
 * path, with no error.
 */

it('customer_create fakes the shape Stripe publishes', function () {
    $config = [];
    $fake = new FakeValues(FakeValues::seedForCall('stripe', 'customer_create', $config));

    $faked = StripeFaker::respond('customer_create', ['config' => $config, 'fake' => $fake]);

    expect($faked)->toBe([
        'id' => 'cus_fake_17ed1b8c2704',
        'object' => 'customer',
        'email' => 'ada@example.test',
        'name' => null,
        'created' => 1767225600,
        'livemode' => false,
    ]);
});

it('payment_intent_create fakes the shape Stripe publishes', function () {
    $config = [
        'currency' => 'usd',
    ];
    $fake = new FakeValues(FakeValues::seedForCall('stripe', 'payment_intent_create', $config));

    $faked = StripeFaker::respond('payment_intent_create', ['config' => $config, 'fake' => $fake]);

    expect($faked)->toBe([
        'id' => 'pi_fake_303f74a80be9',
        'object' => 'payment_intent',
        'amount' => 19569,
        'amount_received' => 19569,
        'currency' => 'usd',
        'customer' => null,
        'description' => null,
        'status' => 'succeeded',
        'livemode' => false,
        'created' => 1767225600,
        'latest_charge' => 'ch_fake_00cc67960be2',
        'receipt_email' => null,
    ]);
});

it('refund_create fakes the shape Stripe publishes', function () {
    $config = [];
    $fake = new FakeValues(FakeValues::seedForCall('stripe', 'refund_create', $config));

    $faked = StripeFaker::respond('refund_create', ['config' => $config, 'fake' => $fake]);

    expect($faked)->toBe([
        'id' => 're_fake_f64f4068d60b',
        'object' => 'refund',
        'amount' => 14142,
        'currency' => 'usd',
        'payment_intent' => 'pi_fake_e67c4c2090f7',
        'reason' => null,
        'status' => 'succeeded',
        'created' => 1767225600,
    ]);
});

it('webhook fakes the shape Stripe publishes', function () {
    $config = [
        'sample' => 'payment_intent.succeeded',
    ];
    $fake = new FakeValues(FakeValues::seedForCall('stripe', 'webhook', $config));

    $faked = StripeFaker::respond('webhook', ['config' => $config, 'fake' => $fake]);

    expect($faked)->toBe([
        'id' => 'evt_fake_80bf44d16c8f',
        'object' => 'event',
        'type' => 'payment_intent.succeeded',
        'api_version' => '2026-01-01',
        'created' => 1767225600,
        'livemode' => false,
        'data' => [
            'object' => [
                'id' => 'pi_fake_4f2fc32a5e11',
                'object' => 'payment_intent',
                'amount' => 2500,
                'amount_received' => 2500,
                'currency' => 'usd',
                'status' => 'succeeded',
            ],
        ],
    ]);
});

it('throws for an operation with no fixture rather than inventing a shape', function () {
    $fake = new FakeValues(FakeValues::seedForCall('stripe', 'no_such_operation', []));

    expect(fn () => StripeFaker::respond('no_such_operation', ['config' => [], 'fake' => $fake]))
        ->toThrow(InvalidArgumentException::class);
});
