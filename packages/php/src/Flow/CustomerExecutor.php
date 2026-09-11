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
use ParticleAcademy\Stripe\Actions\CustomerCreate;
use ParticleAcademy\Stripe\Stripe;

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
 * Stripe customer, run on a fancy-flow-php host.
 *
 * The PHP twin of `stripeCustomerExecutor` in @particle-academy/stripe-js: the
 * same request, built from the node's config by the same
 * `Actions\CustomerCreate` a host would call directly, and the same value on
 * `out` — the client's `{data, mode, connection}`.
 *
 * The client resolves the connection and the estate from the config. With
 * nothing configured that is FAKE, so a node dropped on a canvas runs against
 * the faker rather than Stripe. To reach a real estate, pass a
 * `ConnectorClient` that knows the host's connections — or bind one in the
 * container, which resolves the constructor by type.
 */
#[FlowNode(
    name: '@particle-academy/stripe_customer',
    aliases: [
        'stripe_customer',
    ],
    category: 'io',
    label: 'Stripe customer',
    description: 'Create a Stripe customer.',
    icon: '◆',
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
            'description' => 'Customer id (cus_…).',
        ],
        [
            'path' => 'data.email',
            'type' => 'string',
            'description' => 'The customer\'s email.',
        ],
        [
            'path' => 'data.name',
            'type' => 'string',
            'description' => 'The customer\'s name, when one was given.',
        ],
        [
            'path' => 'data.created',
            'type' => 'number',
            'description' => 'Unix seconds.',
        ],
        [
            'path' => 'data.livemode',
            'type' => 'boolean',
            'description' => 'FALSE for test-mode records.',
        ],
    ],
)]
final class CustomerExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectorClient $client = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();

        // Derived from the RUN and the NODE, never fresh. A retried durable run
        // must send the same key or Stripe creates a second one — the exact
        // failure "unsafe-to-replay" exists to prevent.
        $idempotencyKey = Idempotency::keyFor($ctx, $ctx->node->id, service: Stripe::SERVICE, operation: CustomerCreate::OPERATION);
        if ($idempotencyKey === null) {
            $ctx->emit(RunEvent::log('warn', CustomerCreate::OPERATION.': '.Idempotency::NO_KEY_WARNING, $ctx->node->id));
        }

        $result = ($this->client ?? new ConnectorClient)->call(
            Stripe::descriptor(),
            CustomerCreate::OPERATION,
            $config,
            [
                'method' => CustomerCreate::METHOD,
                'path' => CustomerCreate::PATH,
                'form' => CustomerCreate::body($config),
            ],
            $ctx->input('in'),
            idempotencyKey: $idempotencyKey,
        );

        $id = is_array($result->data) ? ($result->data['id'] ?? null) : null;
        $ctx->emit(RunEvent::log(
            'info',
            'stripe customer_create'.(is_scalar($id) ? ' '.$id : '').' ('.$result->mode->value.')',
            $ctx->node->id,
        ));

        return Port::only('out', $result->toArray());
    }
}
