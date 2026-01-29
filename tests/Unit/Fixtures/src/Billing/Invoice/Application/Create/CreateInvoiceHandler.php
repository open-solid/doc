<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Application\Create;

use App\Billing\Invoice\Domain\Model\InvoiceId;
use OpenSolid\Core\Application\Command\Handler\Attribute\AsCommandHandler;

#[AsCommandHandler]
final readonly class CreateInvoiceHandler
{
    public function __invoke(CreateInvoice $command): InvoiceId
    {
        // Create invoice logic...
        return new InvoiceId('invoice-123');
    }
}
