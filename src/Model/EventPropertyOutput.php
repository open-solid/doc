<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class EventPropertyOutput implements \JsonSerializable
{
    public function __construct(
        public string $name,
        public string $type,
        public string $description,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'type' => $this->type,
            'description' => $this->description,
        ];
    }
}
