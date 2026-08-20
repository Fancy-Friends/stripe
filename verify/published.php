<?php

declare(strict_types=1);

/*
 * Stripe — the published Composer package.
 *
 * GENERATED — do not edit. Fix weaver's template/ and regenerate.
 *
 * This runs against the PUBLISHED package, installed by name from the
 * registry into a project that has never seen this repo. Every other test
 * here imports from ../src and therefore cannot see the packaging.
 */

$autoload = getcwd().'/vendor/autoload.php';

if (! is_file($autoload)) {
    fwrite(STDERR, 'No vendor/autoload.php in '.getcwd().PHP_EOL);
    fwrite(STDERR, 'Run this from a project that has composer-required the published package:'.PHP_EOL);
    fwrite(STDERR, '    composer require particle-academy/stripe-php'.PHP_EOL);
    exit(2);
}

require $autoload;

use ParticleAcademy\Connectors\FakeValues;
use ParticleAcademy\Stripe\StripeFaker;

$goldens = [
    [
        'operation' => 'customer_create',
        'config' => [],
        'expected' => [
            'id' => 'cus_fake_17ed1b8c2704',
            'object' => 'customer',
            'email' => 'ada@example.test',
            'name' => null,
            'created' => 1767225600,
            'livemode' => false,
        ],
    ],
    [
        'operation' => 'payment_intent_create',
        'config' => [
            'currency' => 'usd',
        ],
        'expected' => [
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
        ],
    ],
    [
        'operation' => 'refund_create',
        'config' => [],
        'expected' => [
            'id' => 're_fake_f64f4068d60b',
            'object' => 'refund',
            'amount' => 14142,
            'currency' => 'usd',
            'payment_intent' => 'pi_fake_e67c4c2090f7',
            'reason' => null,
            'status' => 'succeeded',
            'created' => 1767225600,
        ],
    ],
    [
        'operation' => 'webhook',
        'config' => [
            'sample' => 'payment_intent.succeeded',
        ],
        'expected' => [
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
        ],
    ],
];

foreach ($goldens as $golden) {
    $operation = $golden['operation'];
    $config = $golden['config'];

    $fake = new FakeValues(FakeValues::seedForCall('stripe', $operation, $config));
    $faked = StripeFaker::respond($operation, ['config' => $config, 'fake' => $fake]);

    if ($faked !== $golden['expected']) {
        fwrite(STDERR, "the PUBLISHED package produced different bytes for {$operation}\n");
        fwrite(STDERR, '  got:      '.json_encode($faked)."\n");
        fwrite(STDERR, '  expected: '.json_encode($golden['expected'])."\n");
        exit(1);
    }

    echo "  ok   {$operation}\n";
}

echo "\n  ".count($goldens)." operations verified against the published package.\n";
