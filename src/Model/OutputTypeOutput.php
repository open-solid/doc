<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

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
        $data = ['type' => $this->type];

        if (!ScalarType::is($this->type)) {
            $data['class'] = $this->class;
        }

        return $data;
    }
}
