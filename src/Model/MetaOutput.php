<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

final readonly class MetaOutput implements \JsonSerializable
{
    public function __construct(
        public \DateTimeImmutable $generatedAt,
        public string $company,
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
            'company' => $this->company,
            'project' => $this->project,
        ];
    }
}
