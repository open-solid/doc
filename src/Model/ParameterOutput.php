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
        $data = [
            'name' => $this->name,
            'type' => $this->type,
        ];

        if (!ScalarType::is($this->type)) {
            $data['class'] = $this->class;
        }

        return $data;
    }
}
