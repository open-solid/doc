<?php

declare(strict_types=1);

namespace App\Identity\Customer\Domain\Model;

final readonly class CustomerId
{
    public function __construct(
        public string $value,
    ) {
    }
}
