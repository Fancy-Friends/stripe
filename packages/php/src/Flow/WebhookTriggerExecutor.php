<?php

declare(strict_types=1);

namespace ParticleAcademy\Stripe\Flow;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use ParticleAcademy\Connectors\ConnectionHost;
use ParticleAcademy\Connectors\TriggerEvent;
use ParticleAcademy\Stripe\Stripe;
use ParticleAcademy\Stripe\Triggers\Webhook;

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
 * Stripe event, run on a fancy-flow-php host.
 *
 * The PHP twin of `stripeWebhookTriggerExecutor` in
 * @particle-academy/stripe-js. A webhook trigger never calls Stripe: it
 * republishes, on `out`, the delivery the HOST received and verified at its
 * own route. With nothing delivered, fake mode publishes the faker's sample
 * event, so a flow can be designed before the endpoint exists; any other mode
 * refuses, and says how to deliver one.
 */
#[FlowNode(
    name: '@particle-academy/stripe_webhook_trigger',
    aliases: [
        'stripe_webhook_trigger',
    ],
    category: 'trigger',
    label: 'Stripe event',
    description: 'Start when Stripe reports an event.',
    icon: '◈',
    inputs: [],
    outputs: [
        [
            'id' => 'out',
        ],
    ],
    sideEffects: 'none',
    outputShape: [
        [
            'path' => 'id',
            'type' => 'string',
            'description' => 'Event id (evt_…). Stripe redelivers on failure — dedupe on this.',
        ],
        [
            'path' => 'type',
            'type' => 'string',
            'description' => 'The event type, e.g. payment_intent.succeeded.',
        ],
        [
            'path' => 'created',
            'type' => 'number',
            'description' => 'Unix seconds.',
        ],
        [
            'path' => 'livemode',
            'type' => 'boolean',
            'description' => 'FALSE for test-mode events. Branch on this before acting on money.',
        ],
        [
            'path' => 'data.object.id',
            'type' => 'string',
            'description' => 'Id of the object the event is about.',
        ],
        [
            'path' => 'data.object.object',
            'type' => 'string',
            'description' => 'Which kind of object: payment_intent, charge, checkout.session, subscription…',
        ],
        [
            'path' => 'data.object.amount',
            'type' => 'number',
            'description' => 'Amount, where the object carries one.',
        ],
        [
            'path' => 'data.object.currency',
            'type' => 'string',
            'description' => 'Three-letter ISO currency code.',
        ],
        [
            'path' => 'data.object.status',
            'type' => 'string',
            'description' => 'The object\'s status.',
        ],
    ],
)]
final class WebhookTriggerExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectionHost $host = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $service = Stripe::descriptor();

        $connection = ($this->host ?? new ConnectionHost)->resolve(
            $service->service,
            Webhook::OPERATION,
            $config,
            $service->sandbox,
            $service->requires,
            $service->baseUrls,
        );

        $event = TriggerEvent::resolve(
            $service->service,
            Webhook::OPERATION,
            Webhook::DELIVERY,
            Webhook::SETUP,
            $service->faker,
            $connection,
            $ctx->input('in'),
            $config,
        );

        return Port::only('out', $event);
    }
}
