<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Tests\Functional;

use OpenSolid\ArchViewer\ArchExporter;
use OpenSolid\ArchViewer\Command\ExportCommand;
use PHPUnit\Framework\TestCase;

final class ArchViewerBundleTest extends TestCase
{
    private TestKernel $kernel;

    protected function setUp(): void
    {
        $this->kernel = new TestKernel('test', true);
        $this->kernel->boot();
    }

    protected function tearDown(): void
    {
        $this->kernel->shutdown();
    }

    public function testExportCommandServiceIsRegistered(): void
    {
        $container = $this->kernel->getContainer()->get('test.service_container');

        self::assertTrue($container->has('arch_viewer.arch_export_command'));

        $command = $container->get('arch_viewer.arch_export_command');

        self::assertInstanceOf(ExportCommand::class, $command);
    }

    public function testArchExporterServiceIsRegistered(): void
    {
        $container = $this->kernel->getContainer()->get('test.service_container');

        self::assertTrue($container->has(ArchExporter::class));

        $exporter = $container->get(ArchExporter::class);

        self::assertInstanceOf(ArchExporter::class, $exporter);
    }
}
