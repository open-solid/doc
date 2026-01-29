<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Infrastructure;

use App\Billing\Invoice\Domain\Event\InvoiceCreated;
use OpenSolid\Core\Infrastructure\Bus\Event\Subscriber\Attribute\AsDomainEventSubscriber;

/**
 * Sends an email notification when an invoice is created.
 */
#[AsDomainEventSubscriber]
final readonly class SendInvoiceEmailOnCreated
{
    public function __invoke(InvoiceCreated $event): void
    {
        // Send email logic...
    }
}
