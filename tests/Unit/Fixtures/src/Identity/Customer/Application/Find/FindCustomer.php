<?php

declare(strict_types=1);

namespace App\Identity\Customer\Application\Find;

use App\Identity\Customer\Domain\Model\Customer;
use App\Identity\Customer\Domain\Model\CustomerId;
use OpenSolid\Core\Application\Query\Message\Query;

/**
 * Retrieves a customer by their identifier.
 *
 * @extends Query<Customer>
 */
final readonly class FindCustomer extends Query
{
    public function __construct(
        public CustomerId $id,
    ) {
    }
}
