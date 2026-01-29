<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Domain\Model;

/**
 * Invoice aggregate root.
 */
final readonly class Invoice
{
    public function __construct(
        public InvoiceId         $id,
        public InvoiceCustomerId $customerId,
        public int               $amount,
        public string            $currency,
    ) {
    }
}
