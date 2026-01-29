<?php

declare(strict_types=1);

namespace App\Billing\Invoice\Application\Find;

use App\Billing\Invoice\Domain\Model\Invoice;
use App\Billing\Invoice\Domain\Model\InvoiceId;
use OpenSolid\Core\Application\Query\Message\Query;

/**
 * Retrieves an invoice by its identifier.
 *
 * @extends Query<Invoice>
 */
final readonly class FindInvoice extends Query
{
    public function __construct(
        public InvoiceId $id,
    ) {
    }
}
