<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

use OpenSolid\ArchViewer\Model\EventPropertyOutput;

final readonly class DomainEventOutput implements \JsonSerializable
{
    /**
     * @param list<EventPropertyOutput> $properties
     */
    public function __construct(
        public string $name,
        public string $class,
        public string $description,
        public array $properties,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'class' => $this->class,
            'description' => $this->description,
            'properties' => $this->properties,
        ];
    }
}
