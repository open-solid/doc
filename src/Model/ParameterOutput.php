<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

final readonly class ParameterOutput implements \JsonSerializable
{
    public function __construct(
        public string $name,
        public string $type,
        public ?string $class = null,
        public ?string $description = null,
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

        if (null !== $this->class && !ScalarType::is($this->type)) {
            $data['class'] = $this->class;
        }

        if (null !== $this->description) {
            $data['description'] = $this->description;
        }

        return $data;
    }
}
