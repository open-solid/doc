<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class OutputTypeOutput implements \JsonSerializable
{
    public function __construct(
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
            'type' => $this->type,
            'class' => $this->class,
        ];
    }
}
