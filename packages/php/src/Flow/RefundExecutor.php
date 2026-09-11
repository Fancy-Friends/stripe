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
use ParticleAcademy\Stripe\Actions\RefundCreate;
use ParticleAcademy\Stripe\Stripe;

/*
 * GENERATED FILE — do not edit.
 *
 * Emitted from provider/actions/refund-create.json by weaver's generator.
 * A hand-edit here is destroyed by the next protocol sync, which is worse than
 * being rejected, because it works until it silently does not. Fix
 * provider/actions/refund-create.json (or weaver's template/) and regenerate:
 *
 *     npm run provider -- stripe
 */
/**
 * Stripe refund, run on a fancy-flow-php host.
 *
 * The PHP twin of `stripeRefundExecutor` in @particle-academy/stripe-js: the
 * same request, built from the node's config by the same
 * `Actions\RefundCreate` a host would call directly, and the same value on
 * `out` — the client's `{data, mode, connection}`.
 *
 * The client resolves the connection and the estate from the config. With
 * nothing configured that is FAKE, so a node dropped on a canvas runs against
 * the faker rather than Stripe. To reach a real estate, pass a
 * `ConnectorClient` that knows the host's connections — or bind one in the
 * container, which resolves the constructor by type.
 */
#[FlowNode(
    name: '@particle-academy/stripe_refund',
    aliases: [
        'stripe_refund',
    ],
    category: 'io',
    label: 'Stripe refund',
    description: 'Refund a Stripe payment, in full or in part.',
    icon: '◇',
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
            'description' => 'Refund id (re_…).',
        ],
        [
            'path' => 'data.status',
            'type' => 'string',
            'description' => 'succeeded, pending, failed, canceled.',
        ],
        [
            'path' => 'data.amount',
            'type' => 'number',
            'description' => 'Amount refunded, in the currency\'s smallest unit.',
        ],
        [
            'path' => 'data.currency',
            'type' => 'string',
            'description' => 'Three-letter ISO currency code.',
        ],
        [
            'path' => 'data.payment_intent',
            'type' => 'string',
            'description' => 'The payment this refunded.',
        ],
        [
            'path' => 'data.reason',
            'type' => 'string',
            'description' => 'The stated reason, when one was given.',
        ],
    ],
)]
final class RefundExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectorClient $client = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();

        // Derived from the RUN and the NODE, never fresh. A retried durable run
        // must send the same key or Stripe creates a second one — the exact
        // failure "unsafe-to-replay" exists to prevent.
        $idempotencyKey = Idempotency::keyFor($ctx, $ctx->node->id, service: Stripe::SERVICE, operation: RefundCreate::OPERATION);
        if ($idempotencyKey === null) {
            $ctx->emit(RunEvent::log('warn', RefundCreate::OPERATION.': '.Idempotency::NO_KEY_WARNING, $ctx->node->id));
        }

        $result = ($this->client ?? new ConnectorClient)->call(
            Stripe::descriptor(),
            RefundCreate::OPERATION,
            $config,
            [
                'method' => RefundCreate::METHOD,
                'path' => RefundCreate::PATH,
                'form' => RefundCreate::body($config),
            ],
            $ctx->input('in'),
            idempotencyKey: $idempotencyKey,
        );

        $id = is_array($result->data) ? ($result->data['id'] ?? null) : null;
        $ctx->emit(RunEvent::log(
            'info',
            'stripe refund_create'.(is_scalar($id) ? ' '.$id : '').' ('.$result->mode->value.')',
            $ctx->node->id,
        ));

        return Port::only('out', $result->toArray());
    }
}
