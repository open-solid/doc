<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Presentation\Api\Invoice\Create;

/**
 * Input payload for creating an invoice.
 */
final readonly class CreateInvoicePayload
{
    public function __construct(
        public string $customerId,
        public int $amount,
        public string $currency,
    ) {
    }
}
