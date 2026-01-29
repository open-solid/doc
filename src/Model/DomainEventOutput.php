<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class DomainEventOutput implements \JsonSerializable
{
    /**
     * @param list<EventPropertyOutput> $properties
     */
    public function __construct(
        public string $name,
        public string $class,
        public ?string $description,
        public array $properties,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        $data = [
            'name' => $this->name,
            'class' => $this->class,
        ];

        if (null !== $this->description) {
            $data['description'] = $this->description;
        }

        $data['properties'] = $this->properties;

        return $data;
    }
}
