<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Domain\Event;

use OpenSolid\Core\Domain\Event\Message\DomainEvent;

/**
 * Emitted when a new invoice is created.
 */
final readonly class InvoiceCreated extends DomainEvent
{
    /**
     * @param string $aggregateId The aggregate root identifier.
     * @param string $invoiceId The unique identifier of the invoice.
     * @param string $customerId The customer who owns the invoice.
     * @param float $amount The total amount of the invoice.
     */
    public function __construct(
        string $aggregateId,
        public string $invoiceId,
        public string $customerId,
        public float $amount,
    ) {
        parent::__construct($aggregateId);
    }
}
