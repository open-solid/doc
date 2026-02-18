<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Unit\Fixtures;

use OpenSolid\Doc\Scanner\ModuleInfo;
use OpenSolid\Doc\Scanner\ModuleScannerInterface;

/**
 * Stub module scanner for testing that returns predefined modules.
 */
final readonly class StubModuleScanner implements ModuleScannerInterface
{
    /**
     * @param list<ModuleInfo> $modules
     */
    public function __construct(
        private array $modules,
    ) {
    }

    public function scan(string $srcDir): \Generator
    {
        foreach ($this->modules as $module) {
            yield $module;
        }
    }
}
