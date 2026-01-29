<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

use OpenSolid\ArchViewer\Model\OutputTypeOutput;
use OpenSolid\ArchViewer\Model\ParameterOutput;

final readonly class QueryOutput implements \JsonSerializable
{
    /**
     * @param list<ParameterOutput> $input
     */
    public function __construct(
        public string $name,
        public string $class,
        public string $description,
        public array $input,
        public OutputTypeOutput $output,
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
            'input' => $this->input,
            'output' => $this->output,
        ];
    }
}
