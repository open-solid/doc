<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

final readonly class ExternalCallOutput implements \JsonSerializable
{
    public function __construct(
        public string $type,
        public string $source,
        public string $sourceClass,
        public string $name,
        public string $targetClass,
        public string $targetContext,
        public string $targetModule,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function jsonSerialize(): array
    {
        return [
            'type' => $this->type,
            'source' => $this->source,
            'sourceClass' => $this->sourceClass,
            'name' => $this->name,
            'targetClass' => $this->targetClass,
            'targetContext' => $this->targetContext,
            'targetModule' => $this->targetModule,
        ];
    }
}
