<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Functional;

use OpenSolid\Doc\DocExporter;
use Opis\JsonSchema\Errors\ErrorFormatter;
use Opis\JsonSchema\Validator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ExportCommandTest extends TestCase
{
    private TestKernel $kernel;
    private string $outputFile;

    protected function setUp(): void
    {
        $this->kernel = new TestKernel('test', true);
        $this->kernel->boot();
        $this->outputFile = sys_get_temp_dir().'/open_solid_doc_test/arch-export.json';
    }

    protected function tearDown(): void
    {
        $this->kernel->shutdown();

        if (file_exists($this->outputFile)) {
            unlink($this->outputFile);
        }
    }

    #[Test]
    public function itExportsFixturesToJsonFile(): void
    {
        $container = $this->kernel->getContainer()->get('test.service_container');
        $exporter = $container->get(DocExporter::class);

        $fixturesPath = \dirname(__DIR__).'/Unit/Fixtures/src';
        $arch = $exporter->export($fixturesPath, 'test-company', 'test-project');

        $json = json_encode($arch, \JSON_THROW_ON_ERROR | \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES);

        $dir = \dirname($this->outputFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        file_put_contents($this->outputFile, $json."\n");

        self::assertFileExists($this->outputFile);

        $content = file_get_contents($this->outputFile);
        $decoded = json_decode($content, true, 512, \JSON_THROW_ON_ERROR);

        self::assertArrayHasKey('contexts', $decoded);
        self::assertArrayHasKey('meta', $decoded);
        self::assertSame('test-project', $decoded['meta']['project']);
    }

    #[Test]
    public function itExportsValidJsonAgainstSchema(): void
    {
        $container = $this->kernel->getContainer()->get('test.service_container');
        $exporter = $container->get(DocExporter::class);

        $fixturesPath = \dirname(__DIR__).'/Unit/Fixtures/src';
        $arch = $exporter->export($fixturesPath, 'test-company', 'test-project');

        $json = json_encode($arch, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_SLASHES);

        $schemaPath = \dirname(__DIR__, 2).'/arch-schema.json';
        self::assertFileExists($schemaPath, 'Schema file should exist');

        $data = json_decode($json, false, 512, \JSON_THROW_ON_ERROR);
        $schema = json_decode(file_get_contents($schemaPath), false, 512, \JSON_THROW_ON_ERROR);

        $validator = new Validator();
        $result = $validator->validate($data, $schema);

        if (!$result->isValid()) {
            $formatter = new ErrorFormatter();
            $errors = $formatter->format($result->error());

            $errorMessages = [];
            foreach ($errors as $path => $messages) {
                foreach ($messages as $message) {
                    $errorMessages[] = sprintf('%s: %s', $path, $message);
                }
            }

            self::fail("JSON schema validation failed:\n".implode("\n", $errorMessages));
        }

        self::assertTrue($result->isValid());
    }

    #[Test]
    public function itExportsExpectedArchitectureStructure(): void
    {
        $container = $this->kernel->getContainer()->get('test.service_container');
        $exporter = $container->get(DocExporter::class);

        $fixturesPath = \dirname(__DIR__).'/Unit/Fixtures/src';
        $arch = $exporter->export($fixturesPath, 'test-company', 'test-project');

        // Verify contexts
        self::assertCount(2, $arch->contexts);

        $contextNames = array_map(static fn ($c) => $c->name, $arch->contexts);
        self::assertContains('Billing', $contextNames);
        self::assertContains('Identity', $contextNames);

        // Find Billing context
        $billingContext = null;
        foreach ($arch->contexts as $context) {
            if ('Billing' === $context->name) {
                $billingContext = $context;
                break;
            }
        }
        self::assertNotNull($billingContext);

        // Verify Invoice module in Billing context
        self::assertCount(1, $billingContext->modules);
        $invoiceModule = $billingContext->modules[0];
        self::assertSame('Invoice', $invoiceModule->name);

        // Verify commands
        self::assertCount(1, $invoiceModule->commands);
        self::assertSame('CreateInvoice', $invoiceModule->commands[0]->name);

        // Verify queries
        self::assertCount(1, $invoiceModule->queries);
        self::assertSame('FindInvoice', $invoiceModule->queries[0]->name);

        // Verify domain events
        self::assertCount(1, $invoiceModule->domainEvents);
        self::assertSame('InvoiceCreated', $invoiceModule->domainEvents[0]->name);

        // Verify event subscribers
        self::assertCount(1, $invoiceModule->eventSubscribers);
        self::assertSame('SendInvoiceEmailOnCreated', $invoiceModule->eventSubscribers[0]->name);

        // Verify external calls
        self::assertCount(1, $invoiceModule->externalCalls);
        self::assertSame('FindCustomer', $invoiceModule->externalCalls[0]->name);
        self::assertSame('Identity', $invoiceModule->externalCalls[0]->targetContext);
        self::assertSame('Customer', $invoiceModule->externalCalls[0]->targetModule);
    }

    #[Test]
    public function itMatchesExpectedJsonOutput(): void
    {
        $container = $this->kernel->getContainer()->get('test.service_container');
        $exporter = $container->get(DocExporter::class);

        $fixturesPath = \dirname(__DIR__).'/Unit/Fixtures/src';
        $arch = $exporter->export($fixturesPath, 'test-company', 'test-project');

        // Override generatedAt for deterministic comparison
        $archArray = json_decode(json_encode($arch), true);
        $archArray['meta']['generatedAt'] = '2024-01-15T10:30:00+00:00';

        $actualJson = json_encode($archArray, \JSON_THROW_ON_ERROR | \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES);

        $expectedPath = \dirname(__DIR__).'/Unit/Fixtures/expected-arch.json';
        $expectedJson = file_get_contents($expectedPath);

        self::assertJsonStringEqualsJsonString($expectedJson, $actualJson);
    }
}
