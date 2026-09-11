<?php

declare(strict_types=1);

namespace ParticleAcademy\Stripe\Flow;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use ParticleAcademy\Connectors\ConnectorClient;
use ParticleAcademy\Connectors\Idempotency;
use ParticleAcademy\Stripe\Actions\PaymentIntentCreate;
use ParticleAcademy\Stripe\Stripe;

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
 * Stripe payment, run on a fancy-flow-php host.
 *
 * The PHP twin of `stripePaymentIntentExecutor` in
 * @particle-academy/stripe-js: the same request, built from the node's config
 * by the same `Actions\PaymentIntentCreate` a host would call directly, and
 * the same value on `out` — the client's `{data, mode, connection}`.
 *
 * The client resolves the connection and the estate from the config. With
 * nothing configured that is FAKE, so a node dropped on a canvas runs against
 * the faker rather than Stripe. To reach a real estate, pass a
 * `ConnectorClient` that knows the host's connections — or bind one in the
 * container, which resolves the constructor by type.
 */
#[FlowNode(
    name: '@particle-academy/stripe_payment_intent',
    aliases: [
        'stripe_payment_intent',
    ],
    category: 'io',
    label: 'Stripe payment',
    description: 'Create a Stripe PaymentIntent — take a payment.',
    icon: '◈',
    inputs: [
        [
            'id' => 'in',
        ],
    ],
    outputs: [
        [
            'id' => 'out',
        ],
    ],
    sideEffects: 'unsafe-to-replay',
    outputShape: [
        [
            'path' => 'mode',
            'type' => 'string',
            'description' => 'Which estate this ran against: fake, sandbox or live.',
        ],
        [
            'path' => 'connection',
            'type' => 'string',
            'description' => 'The connection id that was used.',
        ],
        [
            'path' => 'data.id',
            'type' => 'string',
            'description' => 'Payment intent id (pi_…).',
        ],
        [
            'path' => 'data.status',
            'type' => 'string',
            'description' => 'succeeded, requires_action, requires_payment_method, …',
        ],
        [
            'path' => 'data.amount',
            'type' => 'number',
            'description' => 'Amount in the currency\'s smallest unit.',
        ],
        [
            'path' => 'data.currency',
            'type' => 'string',
            'description' => 'Three-letter ISO currency code.',
        ],
        [
            'path' => 'data.customer',
            'type' => 'string',
            'description' => 'Customer id, when one was given.',
        ],
        [
            'path' => 'data.latest_charge',
            'type' => 'string',
            'description' => 'The charge this intent produced.',
        ],
        [
            'path' => 'data.livemode',
            'type' => 'boolean',
            'description' => 'FALSE for test-mode money. Branch on this before acting on a payment.',
        ],
    ],
)]
final class PaymentIntentExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectorClient $client = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();

        // Derived from the RUN and the NODE, never fresh. A retried durable run
        // must send the same key or Stripe creates a second one — the exact
        // failure "unsafe-to-replay" exists to prevent.
        $idempotencyKey = Idempotency::keyFor($ctx, $ctx->node->id, service: Stripe::SERVICE, operation: PaymentIntentCreate::OPERATION);
        if ($idempotencyKey === null) {
            $ctx->emit(RunEvent::log('warn', PaymentIntentCreate::OPERATION.': '.Idempotency::NO_KEY_WARNING, $ctx->node->id));
        }

        $result = ($this->client ?? new ConnectorClient)->call(
            Stripe::descriptor(),
            PaymentIntentCreate::OPERATION,
            $config,
            [
                'method' => PaymentIntentCreate::METHOD,
                'path' => PaymentIntentCreate::PATH,
                'form' => PaymentIntentCreate::body($config),
            ],
            $ctx->input('in'),
            idempotencyKey: $idempotencyKey,
        );

        $id = is_array($result->data) ? ($result->data['id'] ?? null) : null;
        $ctx->emit(RunEvent::log(
            'info',
            'stripe payment_intent_create'.(is_scalar($id) ? ' '.$id : '').' ('.$result->mode->value.')',
            $ctx->node->id,
        ));

        return Port::only('out', $result->toArray());
    }
}
