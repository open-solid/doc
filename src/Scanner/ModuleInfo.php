<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Scanner;

final readonly class ModuleInfo
{
    public function __construct(
        public string $context,
        public string $module,
        public string $path,
    ) {
    }
}
