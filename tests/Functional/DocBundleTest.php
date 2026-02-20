<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Functional;

use OpenSolid\Doc\DocExporter;
use OpenSolid\Doc\Command\ExportCommand;
use PHPUnit\Framework\TestCase;

final class DocBundleTest extends TestCase
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

        self::assertTrue($container->has('open_solid_doc.arch_export_command'));

        $command = $container->get('open_solid_doc.arch_export_command');

        self::assertInstanceOf(ExportCommand::class, $command);
    }

    public function testArchExporterServiceIsRegistered(): void
    {
        $container = $this->kernel->getContainer()->get('test.service_container');

        self::assertTrue($container->has(DocExporter::class));

        $exporter = $container->get(DocExporter::class);

        self::assertInstanceOf(DocExporter::class, $exporter);
    }
}
