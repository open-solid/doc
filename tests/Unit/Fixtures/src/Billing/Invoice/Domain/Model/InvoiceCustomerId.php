<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Domain\Model;

final readonly class InvoiceCustomerId
{
    public function __construct(
        public string $value,
    ) {
    }
}
