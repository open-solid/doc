<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class MetaOutput implements \JsonSerializable
{
    public function __construct(
        public \DateTimeImmutable $generatedAt,
        public string $project,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function jsonSerialize(): array
    {
        return [
            'generatedAt' => $this->generatedAt->format('c'),
            'project' => $this->project,
        ];
    }
}
