<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Scanner;

interface ModuleScannerInterface
{
    /**
     * Scans for modules in the given source directory.
     *
     * @return \Generator<ModuleInfo>
     */
    public function scan(string $srcDir): \Generator;
}
