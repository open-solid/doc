<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

use OpenSolid\Doc\Model\OutputTypeOutput;
use OpenSolid\Doc\Model\ParameterOutput;

final readonly class QueryOutput implements \JsonSerializable
{
    /**
     * @param list<ParameterOutput> $input
     */
    public function __construct(
        public string $name,
        public string $class,
        public ?string $description,
        public array $input,
        public OutputTypeOutput $output,
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

        $data['input'] = $this->input;
        $data['output'] = $this->output;

        return $data;
    }
}
