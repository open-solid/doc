<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class ParameterOutput implements \JsonSerializable
{
    public function __construct(
        public string $name,
        public string $type,
        public string $class,
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
            'class' => $this->class,
        ];
    }
}
