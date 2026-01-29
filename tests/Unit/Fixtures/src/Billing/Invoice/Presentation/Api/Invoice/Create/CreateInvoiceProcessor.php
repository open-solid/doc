<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Presentation\Api\Invoice\Create;

use App\Billing\Invoice\Application\Create\CreateInvoice;
use App\Billing\Invoice\Domain\Model\InvoiceCustomerId;
use App\Billing\Invoice\Domain\Model\InvoiceId;
use App\Identity\Customer\Application\Find\FindCustomer;
use App\Identity\Customer\Domain\Model\CustomerId;
use OpenSolid\Core\Application\Command\Bus\CommandBus;
use OpenSolid\Core\Application\Query\Bus\QueryBus;

/**
 * API processor that creates an invoice after validating the customer exists.
 */
final readonly class CreateInvoiceProcessor
{
    public function __construct(
        private CommandBus $commandBus,
        private QueryBus $queryBus,
    ) {
    }

    public function __invoke(CreateInvoicePayload $payload): InvoiceId
    {
        // Validate customer exists via external query
        $this->queryBus->ask(new FindCustomer(new CustomerId($payload->customerId)));

        // Create the invoice
        return $this->commandBus->execute(new CreateInvoice(
            customerId: new InvoiceCustomerId($payload->customerId),
            amount: $payload->amount,
            currency: $payload->currency,
        ));
    }
}
