<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Unit\Scanner;

use OpenSolid\Doc\Scanner\ClassScanner;
use OpenSolid\Doc\Scanner\ModuleInfo;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ClassScannerTest extends TestCase
{
    private ClassScanner $scanner;
    private string $fixturesPath;

    protected function setUp(): void
    {
        $this->scanner = new ClassScanner();
        $this->fixturesPath = __DIR__.'/Fixtures';
    }

    #[Test]
    public function itScansAllPhpFilesInModule(): void
    {
        $moduleInfo = new ModuleInfo(
            context: 'TestContext',
            module: 'TestModule',
            path: $this->fixturesPath.'/TestModule',
        );

        $classes = iterator_to_array($this->scanner->scan($moduleInfo));

        self::assertCount(2, $classes);

        $classNames = array_map(static fn (\ReflectionClass $c) => $c->getShortName(), $classes);
        sort($classNames);

        self::assertSame(['TestClass', 'TestSubClass'], $classNames);
    }

    #[Test]
    public function itScansSpecificSubdirectory(): void
    {
        $moduleInfo = new ModuleInfo(
            context: 'TestContext',
            module: 'TestModule',
            path: $this->fixturesPath.'/TestModule',
        );

        $classes = iterator_to_array($this->scanner->scanDirectory($moduleInfo, 'SubDir'));

        self::assertCount(1, $classes);
        self::assertSame('TestSubClass', $classes[0]->getShortName());
    }

    #[Test]
    public function itReturnsEmptyForNonExistentSubdirectory(): void
    {
        $moduleInfo = new ModuleInfo(
            context: 'TestContext',
            module: 'TestModule',
            path: $this->fixturesPath.'/TestModule',
        );

        $classes = iterator_to_array($this->scanner->scanDirectory($moduleInfo, 'NonExistent'));

        self::assertCount(0, $classes);
    }
}
