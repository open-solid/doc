<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class EventPropertyOutput implements \JsonSerializable
{
    public function __construct(
        public string $name,
        public string $type,
        public ?string $description,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function jsonSerialize(): array
    {
        $data = [
            'name' => $this->name,
            'type' => $this->type,
        ];

        if (null !== $this->description) {
            $data['description'] = $this->description;
        }

        return $data;
    }
}
