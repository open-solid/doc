<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

final class ScalarType
{
    private const array TYPES = [
        'int', 'integer', 'float', 'double', 'string', 'bool', 'boolean',
        'array', 'object', 'callable', 'iterable', 'resource', 'null',
        'void', 'mixed', 'never', 'true', 'false',
    ];

    public static function is(string $type): bool
    {
        return in_array(strtolower($type), self::TYPES, true);
    }
}
