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
     * The unique identifier of the invoice.
     */
    public string $invoiceId;

    /**
     * The customer who owns the invoice.
     */
    public string $customerId;

    /**
     * The total amount of the invoice.
     */
    public float $amount;

    public function __construct(
        string $aggregateId,
        string $invoiceId,
        string $customerId,
        float $amount,
    ) {
        parent::__construct($aggregateId);
        $this->invoiceId = $invoiceId;
        $this->customerId = $customerId;
        $this->amount = $amount;
    }
}
