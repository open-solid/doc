<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Unit;

use OpenSolid\Doc\DocExporter;
use OpenSolid\Doc\Extractor\CommandExtractor;
use OpenSolid\Doc\Extractor\DomainEventExtractor;
use OpenSolid\Doc\Extractor\EventSubscriberExtractor;
use OpenSolid\Doc\Extractor\ExternalCallExtractor;
use OpenSolid\Doc\Extractor\QueryExtractor;
use OpenSolid\Doc\Model\ArchOutput;
use OpenSolid\Doc\Model\CommandOutput;
use OpenSolid\Doc\Model\ContextOutput;
use OpenSolid\Doc\Model\DomainEventOutput;
use OpenSolid\Doc\Model\EventSubscriberOutput;
use OpenSolid\Doc\Model\ExternalCallOutput;
use OpenSolid\Doc\Model\MetaOutput;
use OpenSolid\Doc\Model\ModuleOutput;
use OpenSolid\Doc\Model\OutputTypeOutput;
use OpenSolid\Doc\Model\ParameterOutput;
use OpenSolid\Doc\Model\QueryOutput;
use OpenSolid\Doc\Parser\DocBlockParser;
use OpenSolid\Doc\Parser\GenericTypeParser;
use OpenSolid\Doc\Scanner\ClassScanner;
use OpenSolid\Doc\Scanner\ModuleInfo;
use OpenSolid\Doc\Tests\Unit\Fixtures\StubModuleScanner;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class DocExporterTest extends TestCase
{
    #[Test]
    public function itMatchesExpectedJsonSchemaFromRealFixtures(): void
    {
        $fixturesPath = __DIR__.'/Fixtures/src';

        // Create real dependencies
        $classScanner = new ClassScanner();
        $docBlockParser = new DocBlockParser();
        $genericTypeParser = new GenericTypeParser();

        // Create a stub module scanner that returns our fixture modules
        $moduleScanner = new StubModuleScanner([
            new ModuleInfo(
                context: 'Billing',
                module: 'Invoice',
                path: $fixturesPath.'/Billing/Invoice',
                description: 'Handles invoice creation, retrieval, and billing operations.',
            ),
            new ModuleInfo(
                context: 'Identity',
                module: 'Customer',
                path: $fixturesPath.'/Identity/Customer',
                description: 'Manages customer identity and profile information.',
            ),
        ]);

        $commandExtractor = new CommandExtractor($classScanner, $docBlockParser, $genericTypeParser);
        $queryExtractor = new QueryExtractor($classScanner, $docBlockParser, $genericTypeParser);
        $domainEventExtractor = new DomainEventExtractor($classScanner, $docBlockParser);
        $eventSubscriberExtractor = new EventSubscriberExtractor($classScanner, $docBlockParser);
        $externalCallExtractor = new ExternalCallExtractor($classScanner);

        $exporter = new DocExporter(
            $moduleScanner,
            $commandExtractor,
            $queryExtractor,
            $domainEventExtractor,
            $eventSubscriberExtractor,
            $externalCallExtractor,
        );

        $arch = $exporter->export($fixturesPath, 'test-project');

        // Override generatedAt for deterministic comparison
        $archArray = json_decode(json_encode($arch), true);
        $archArray['meta']['generatedAt'] = '2024-01-15T10:30:00+00:00';

        $actualJson = json_encode($archArray, \JSON_THROW_ON_ERROR | \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES);
        $expectedJson = file_get_contents(__DIR__.'/Fixtures/expected-arch.json');

        self::assertJsonStringEqualsJsonString($expectedJson, $actualJson);
    }

    #[Test]
    public function itMatchesExpectedJsonSchema(): void
    {
        $arch = $this->createFullArchOutput();

        $actualJson = json_encode($arch, \JSON_THROW_ON_ERROR | \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES);
        $expectedJson = file_get_contents(__DIR__.'/Fixtures/expected-arch.json');

        self::assertJsonStringEqualsJsonString($expectedJson, $actualJson);
    }

    #[Test]
    public function itContainsAllSchemaFields(): void
    {
        $arch = $this->createFullArchOutput();
        $json = json_encode($arch, \JSON_THROW_ON_ERROR);
        $decoded = json_decode($json, true, 512, \JSON_THROW_ON_ERROR);

        // Verify top-level structure
        self::assertArrayHasKey('contexts', $decoded);
        self::assertArrayHasKey('meta', $decoded);

        // Verify meta
        self::assertArrayHasKey('generatedAt', $decoded['meta']);
        self::assertArrayHasKey('project', $decoded['meta']);

        // Verify context structure
        $billingContext = $decoded['contexts'][0];
        self::assertArrayHasKey('name', $billingContext);
        self::assertArrayHasKey('modules', $billingContext);

        // Verify module structure
        $invoiceModule = $billingContext['modules'][0];
        self::assertArrayHasKey('name', $invoiceModule);
        self::assertArrayHasKey('description', $invoiceModule);
        self::assertArrayHasKey('commands', $invoiceModule);
        self::assertArrayHasKey('queries', $invoiceModule);
        self::assertArrayHasKey('domainEvents', $invoiceModule);
        self::assertArrayHasKey('eventSubscribers', $invoiceModule);
        self::assertArrayHasKey('externalCalls', $invoiceModule);

        // Verify command structure
        $command = $invoiceModule['commands'][0];
        self::assertArrayHasKey('name', $command);
        self::assertArrayHasKey('class', $command);
        self::assertArrayHasKey('description', $command);
        self::assertArrayHasKey('input', $command);
        self::assertArrayHasKey('output', $command);

        // Verify parameter structure
        $parameter = $command['input'][0];
        self::assertArrayHasKey('name', $parameter);
        self::assertArrayHasKey('type', $parameter);
        self::assertArrayHasKey('class', $parameter);

        // Verify output type structure
        self::assertArrayHasKey('type', $command['output']);
        self::assertArrayHasKey('class', $command['output']);

        // Verify query structure
        $query = $invoiceModule['queries'][0];
        self::assertArrayHasKey('name', $query);
        self::assertArrayHasKey('class', $query);
        self::assertArrayHasKey('description', $query);
        self::assertArrayHasKey('input', $query);
        self::assertArrayHasKey('output', $query);

        // Verify domain event structure
        $domainEvent = $invoiceModule['domainEvents'][0];
        self::assertArrayHasKey('name', $domainEvent);
        self::assertArrayHasKey('class', $domainEvent);
        self::assertArrayHasKey('description', $domainEvent);
        self::assertArrayHasKey('properties', $domainEvent);

        // Verify event property structure (check a child property that has description)
        $eventProperty = $domainEvent['properties'][3]; // invoiceId property
        self::assertArrayHasKey('name', $eventProperty);
        self::assertArrayHasKey('type', $eventProperty);
        self::assertArrayHasKey('description', $eventProperty);

        // Verify parent properties are included first
        self::assertSame('id', $domainEvent['properties'][0]['name']);
        self::assertSame('aggregateId', $domainEvent['properties'][1]['name']);
        self::assertSame('occurredOn', $domainEvent['properties'][2]['name']);

        // Verify event subscriber structure
        $subscriber = $invoiceModule['eventSubscribers'][0];
        self::assertArrayHasKey('name', $subscriber);
        self::assertArrayHasKey('class', $subscriber);
        self::assertArrayHasKey('description', $subscriber);
        self::assertArrayHasKey('event', $subscriber);
        self::assertArrayHasKey('eventClass', $subscriber);

        // Verify external call structure
        $externalCall = $invoiceModule['externalCalls'][0];
        self::assertArrayHasKey('type', $externalCall);
        self::assertArrayHasKey('source', $externalCall);
        self::assertArrayHasKey('sourceClass', $externalCall);
        self::assertArrayHasKey('name', $externalCall);
        self::assertArrayHasKey('targetClass', $externalCall);
        self::assertArrayHasKey('targetContext', $externalCall);
        self::assertArrayHasKey('targetModule', $externalCall);
    }

    private function createFullArchOutput(): ArchOutput
    {
        // Billing context - Invoice module
        $createInvoiceCommand = new CommandOutput(
            name: 'CreateInvoice',
            class: 'App\\Billing\\Invoice\\Application\\Create\\CreateInvoice',
            description: 'Creates a new invoice for a customer.',
            input: [
                new ParameterOutput(
                    name: 'customerId',
                    type: 'InvoiceCustomerId',
                    class: 'App\\Billing\\Invoice\\Domain\\Model\\InvoiceCustomerId',
                    description: 'The customer who will own the invoice.',
                ),
                new ParameterOutput(
                    name: 'amount',
                    type: 'int',
                    class: 'int',
                    description: 'The invoice amount in cents.',
                ),
                new ParameterOutput(
                    name: 'currency',
                    type: 'string',
                    class: 'string',
                    description: 'The currency code (e.g., USD, EUR).',
                ),
            ],
            output: new OutputTypeOutput(
                type: 'InvoiceId',
                class: 'App\\Billing\\Invoice\\Domain\\Model\\InvoiceId',
            ),
        );

        $findInvoiceQuery = new QueryOutput(
            name: 'FindInvoice',
            class: 'App\\Billing\\Invoice\\Application\\Find\\FindInvoice',
            description: 'Retrieves an invoice by its identifier.',
            input: [
                new ParameterOutput(
                    name: 'id',
                    type: 'InvoiceId',
                    class: 'App\\Billing\\Invoice\\Domain\\Model\\InvoiceId',
                    description: 'The unique identifier of the invoice.',
                ),
            ],
            output: new OutputTypeOutput(
                type: 'Invoice',
                class: 'App\\Billing\\Invoice\\Domain\\Model\\Invoice',
            ),
        );

        $invoiceCreatedEvent = new DomainEventOutput(
            name: 'InvoiceCreated',
            class: 'App\\Billing\\Invoice\\Domain\\Event\\InvoiceCreated',
            description: 'Emitted when a new invoice is created.',
            properties: [
                new ParameterOutput(
                    name: 'id',
                    type: 'string',
                    description: 'Unique identifier for this event instance (autogenerated).',
                ),
                new ParameterOutput(
                    name: 'aggregateId',
                    type: 'string',
                    description: 'Identifier of the aggregate that produced this event.',
                ),
                new ParameterOutput(
                    name: 'occurredOn',
                    type: 'DateTimeImmutable',
                    description: 'Timestamp when this event occurred (autogenerated).',
                ),
                new ParameterOutput(
                    name: 'invoiceId',
                    type: 'string',
                    description: 'The unique identifier of the invoice.',
                ),
                new ParameterOutput(
                    name: 'customerId',
                    type: 'string',
                    description: 'The customer who owns the invoice.',
                ),
                new ParameterOutput(
                    name: 'amount',
                    type: 'float',
                    description: 'The total amount of the invoice.',
                ),
            ],
        );

        $sendEmailSubscriber = new EventSubscriberOutput(
            name: 'SendInvoiceEmailOnCreated',
            class: 'App\\Billing\\Invoice\\Infrastructure\\SendInvoiceEmailOnCreated',
            description: 'Sends an email notification when an invoice is created.',
            event: 'InvoiceCreated',
            eventClass: 'App\\Billing\\Invoice\\Domain\\Event\\InvoiceCreated',
        );

        $findCustomerExternalCall = new ExternalCallOutput(
            type: 'query',
            source: 'CreateInvoiceProcessor',
            sourceClass: 'App\\Billing\\Invoice\\Presentation\\Api\\Invoice\\Create\\CreateInvoiceProcessor',
            name: 'FindCustomer',
            targetClass: 'App\\Identity\\Customer\\Application\\Find\\FindCustomer',
            targetContext: 'Identity',
            targetModule: 'Customer',
        );

        $invoiceModule = new ModuleOutput(
            name: 'Invoice',
            description: 'Handles invoice creation, retrieval, and billing operations.',
            commands: [$createInvoiceCommand],
            queries: [$findInvoiceQuery],
            domainEvents: [$invoiceCreatedEvent],
            eventSubscribers: [$sendEmailSubscriber],
            externalCalls: [$findCustomerExternalCall],
        );

        $billingContext = new ContextOutput(
            name: 'Billing',
            modules: [$invoiceModule],
        );

        // Identity context - Customer module
        $findCustomerQuery = new QueryOutput(
            name: 'FindCustomer',
            class: 'App\\Identity\\Customer\\Application\\Find\\FindCustomer',
            description: 'Retrieves a customer by their identifier.',
            input: [
                new ParameterOutput(
                    name: 'id',
                    type: 'CustomerId',
                    class: 'App\\Identity\\Customer\\Domain\\Model\\CustomerId',
                    description: 'The unique identifier of the customer.',
                ),
            ],
            output: new OutputTypeOutput(
                type: 'Customer',
                class: 'App\\Identity\\Customer\\Domain\\Model\\Customer',
            ),
        );

        $customerModule = new ModuleOutput(
            name: 'Customer',
            description: 'Manages customer identity and profile information.',
            commands: [],
            queries: [$findCustomerQuery],
            domainEvents: [],
            eventSubscribers: [],
            externalCalls: [],
        );

        $identityContext = new ContextOutput(
            name: 'Identity',
            modules: [$customerModule],
        );

        return new ArchOutput(
            contexts: [$billingContext, $identityContext],
            meta: new MetaOutput(
                generatedAt: new \DateTimeImmutable('2024-01-15T10:30:00+00:00'),
                project: 'test-project',
            ),
        );
    }

    #[Test]
    public function itCreatesArchOutputWithCorrectStructure(): void
    {
        $command = new CommandOutput(
            name: 'CreateInvoice',
            class: 'App\\Billing\\Invoice\\Application\\Create\\CreateInvoice',
            description: 'Creates a new invoice',
            input: [],
            output: new OutputTypeOutput('void', 'void'),
        );

        $query = new QueryOutput(
            name: 'GetInvoice',
            class: 'App\\Billing\\Invoice\\Application\\GetInvoice',
            description: 'Gets an invoice by ID',
            input: [],
            output: new OutputTypeOutput('Invoice', 'App\\Billing\\Invoice\\Domain\\Model\\Invoice'),
        );

        $module = new ModuleOutput(
            name: 'Invoice',
            commands: [$command],
            queries: [$query],
            domainEvents: [],
            eventSubscribers: [],
            externalCalls: [],
        );

        $context = new ContextOutput(
            name: 'Billing',
            modules: [$module],
        );

        $meta = new MetaOutput(
            generatedAt: new \DateTimeImmutable('2024-01-01 00:00:00'),
            project: 'test-project',
        );

        $arch = new ArchOutput(
            contexts: [$context],
            meta: $meta,
        );

        self::assertSame('test-project', $arch->meta->project);
        self::assertCount(1, $arch->contexts);
        self::assertSame('Billing', $arch->contexts[0]->name);
        self::assertCount(1, $arch->contexts[0]->modules);
        self::assertSame('Invoice', $arch->contexts[0]->modules[0]->name);
        self::assertCount(1, $arch->contexts[0]->modules[0]->commands);
        self::assertSame('CreateInvoice', $arch->contexts[0]->modules[0]->commands[0]->name);
        self::assertCount(1, $arch->contexts[0]->modules[0]->queries);
        self::assertSame('GetInvoice', $arch->contexts[0]->modules[0]->queries[0]->name);
    }

    #[Test]
    public function itSerializesArchOutputToJson(): void
    {
        $command = new CommandOutput(
            name: 'CreateInvoice',
            class: 'App\\Billing\\Invoice\\Application\\Create\\CreateInvoice',
            description: 'Creates a new invoice',
            input: [],
            output: new OutputTypeOutput('void', 'void'),
        );

        $module = new ModuleOutput(
            name: 'Invoice',
            commands: [$command],
            queries: [],
            domainEvents: [],
            eventSubscribers: [],
            externalCalls: [],
        );

        $context = new ContextOutput(
            name: 'Billing',
            modules: [$module],
        );

        $meta = new MetaOutput(
            generatedAt: new \DateTimeImmutable('2024-01-01T00:00:00+00:00'),
            project: 'test-project',
        );

        $arch = new ArchOutput(
            contexts: [$context],
            meta: $meta,
        );

        $json = json_encode($arch, \JSON_THROW_ON_ERROR);
        $decoded = json_decode($json, true, 512, \JSON_THROW_ON_ERROR);

        self::assertArrayHasKey('contexts', $decoded);
        self::assertArrayHasKey('meta', $decoded);
        self::assertSame('test-project', $decoded['meta']['project']);
        self::assertSame('Billing', $decoded['contexts'][0]['name']);
        self::assertSame('Invoice', $decoded['contexts'][0]['modules'][0]['name']);
        self::assertSame('CreateInvoice', $decoded['contexts'][0]['modules'][0]['commands'][0]['name']);
    }

    #[Test]
    public function itHandlesEmptyContexts(): void
    {
        $meta = new MetaOutput(
            generatedAt: new \DateTimeImmutable(),
            project: 'empty-project',
        );

        $arch = new ArchOutput(
            contexts: [],
            meta: $meta,
        );

        self::assertCount(0, $arch->contexts);
        self::assertSame('empty-project', $arch->meta->project);
        self::assertInstanceOf(\DateTimeImmutable::class, $arch->meta->generatedAt);
    }

    #[Test]
    public function contextOutputSortsAlphabetically(): void
    {
        $contexts = [
            new ContextOutput('Zebra', []),
            new ContextOutput('Alpha', []),
            new ContextOutput('Billing', []),
        ];

        usort($contexts, static fn (ContextOutput $a, ContextOutput $b) => strcmp($a->name, $b->name));

        self::assertSame('Alpha', $contexts[0]->name);
        self::assertSame('Billing', $contexts[1]->name);
        self::assertSame('Zebra', $contexts[2]->name);
    }
}
