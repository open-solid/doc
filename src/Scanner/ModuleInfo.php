<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Scanner;

final readonly class ModuleInfo
{
    public function __construct(
        public string $context,
        public string $module,
        public string $path,
        public ?string $description = null,
    ) {
    }
}
