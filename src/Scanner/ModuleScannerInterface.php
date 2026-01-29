<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Scanner;

interface ModuleScannerInterface
{
    /**
     * Scans for modules in the given source directory.
     *
     * @return \Generator<ModuleInfo>
     */
    public function scan(string $srcDir): \Generator;
}
