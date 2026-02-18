<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

use OpenSolid\Doc\Model\ContextOutput;
use OpenSolid\Doc\Model\MetaOutput;

final readonly class ArchOutput implements \JsonSerializable
{
    /**
     * @param list<ContextOutput> $contexts
     */
    public function __construct(
        public array $contexts,
        public MetaOutput $meta,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'contexts' => $this->contexts,
            'meta' => $this->meta,
        ];
    }
}
