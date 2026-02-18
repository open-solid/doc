<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Unit\Scanner;

use OpenSolid\Doc\Scanner\ModuleScanner;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ModuleScannerTest extends TestCase
{
    private ModuleScanner $scanner;
    private string $fixturesPath;

    protected function setUp(): void
    {
        $this->scanner = new ModuleScanner();
        $this->fixturesPath = dirname(__DIR__).'/Fixtures/src';
    }

    #[Test]
    public function itExtractsModuleDescriptionFromPhpDocBlock(): void
    {
        $modules = iterator_to_array($this->scanner->scan($this->fixturesPath));

        self::assertCount(2, $modules);

        // Find Invoice module
        $invoiceModule = null;
        $customerModule = null;
        foreach ($modules as $module) {
            if ('Invoice' === $module->module) {
                $invoiceModule = $module;
            }
            if ('Customer' === $module->module) {
                $customerModule = $module;
            }
        }

        self::assertNotNull($invoiceModule);
        self::assertNotNull($customerModule);

        self::assertSame('Handles invoice creation, retrieval, and billing operations.', $invoiceModule->description);
        self::assertSame('Manages customer identity and profile information.', $customerModule->description);
    }

    #[Test]
    public function itReturnsNullDescriptionWhenNoPhpDocBlock(): void
    {
        // Create a temporary module extension without PHPDoc
        $tempDir = sys_get_temp_dir().'/doc-test-'.uniqid();
        $moduleDir = $tempDir.'/TestContext/TestModule/Infrastructure';
        mkdir($moduleDir, 0777, true);

        $extensionContent = <<<'PHP'
<?php

namespace App\TestContext\TestModule\Infrastructure;

use OpenSolid\Core\Infrastructure\Symfony\Module\ModuleExtension;

final class TestModuleExtension extends ModuleExtension
{
}
PHP;

        file_put_contents($moduleDir.'/TestModuleExtension.php', $extensionContent);

        // Need to autoload the class for reflection
        require_once $moduleDir.'/TestModuleExtension.php';

        $modules = iterator_to_array($this->scanner->scan($tempDir));

        self::assertCount(1, $modules);
        self::assertSame('TestModule', $modules[0]->module);
        self::assertNull($modules[0]->description);

        // Cleanup
        unlink($moduleDir.'/TestModuleExtension.php');
        rmdir($moduleDir);
        rmdir(dirname($moduleDir));
        rmdir(dirname($moduleDir, 2));
        rmdir($tempDir);
    }

    #[Test]
    public function itExtractsMultiLineDescription(): void
    {
        // Create a temporary module extension with multi-line PHPDoc
        $tempDir = sys_get_temp_dir().'/doc-test-'.uniqid();
        $moduleDir = $tempDir.'/TestContext/MultiLine/Infrastructure';
        mkdir($moduleDir, 0777, true);

        $extensionContent = <<<'PHP'
<?php

namespace App\TestContext\MultiLine\Infrastructure;

use OpenSolid\Core\Infrastructure\Symfony\Module\ModuleExtension;

/**
 * This is a multi-line description
 * that spans multiple lines.
 *
 * @author Test Author
 */
final class MultiLineExtension extends ModuleExtension
{
}
PHP;

        file_put_contents($moduleDir.'/MultiLineExtension.php', $extensionContent);

        require_once $moduleDir.'/MultiLineExtension.php';

        $modules = iterator_to_array($this->scanner->scan($tempDir));

        self::assertCount(1, $modules);
        self::assertSame('MultiLine', $modules[0]->module);
        self::assertSame('This is a multi-line description that spans multiple lines.', $modules[0]->description);

        // Cleanup
        unlink($moduleDir.'/MultiLineExtension.php');
        rmdir($moduleDir);
        rmdir(dirname($moduleDir));
        rmdir(dirname($moduleDir, 2));
        rmdir($tempDir);
    }
}
