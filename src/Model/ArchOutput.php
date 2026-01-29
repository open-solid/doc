<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

use OpenSolid\ArchViewer\Model\ContextOutput;
use OpenSolid\ArchViewer\Model\MetaOutput;

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
