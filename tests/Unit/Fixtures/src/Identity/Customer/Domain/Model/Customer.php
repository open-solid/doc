<?php

declare(strict_types=1);

namespace App\Identity\Customer\Domain\Model;

/**
 * Customer aggregate root.
 */
final readonly class Customer
{
    public function __construct(
        public CustomerId $id,
        public string $name,
        public string $email,
    ) {
    }
}
