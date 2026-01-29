<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

use OpenSolid\ArchViewer\Model\ModuleOutput;

final readonly class ContextOutput implements \JsonSerializable
{
    /**
     * @param list<ModuleOutput> $modules
     */
    public function __construct(
        public string $name,
        public array $modules = [],
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'modules' => $this->modules,
        ];
    }
}
