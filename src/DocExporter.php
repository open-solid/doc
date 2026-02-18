<?php

declare(strict_types=1);

namespace OpenSolid\Doc;

use OpenSolid\Doc\Extractor\CommandExtractor;
use OpenSolid\Doc\Extractor\DomainEventExtractor;
use OpenSolid\Doc\Extractor\EventSubscriberExtractor;
use OpenSolid\Doc\Extractor\ExternalCallExtractor;
use OpenSolid\Doc\Extractor\QueryExtractor;
use OpenSolid\Doc\Model\ArchOutput;
use OpenSolid\Doc\Model\ContextOutput;
use OpenSolid\Doc\Model\MetaOutput;
use OpenSolid\Doc\Model\ModuleOutput;
use OpenSolid\Doc\Scanner\ModuleScannerInterface;

final readonly class DocExporter
{
    public function __construct(
        private ModuleScannerInterface $moduleScanner,
        private CommandExtractor $commandExtractor,
        private QueryExtractor $queryExtractor,
        private DomainEventExtractor $domainEventExtractor,
        private EventSubscriberExtractor $eventSubscriberExtractor,
        private ExternalCallExtractor $externalCallExtractor,
    ) {
    }

    public function export(string $srcDir, string $company, string $project): ArchOutput
    {
        /** @var ModuleOutput[] $contextModules */
        $contextModules = [];

        foreach ($this->moduleScanner->scan($srcDir) as $moduleInfo) {
            $moduleOutput = new ModuleOutput(
                name: $moduleInfo->module,
                description: $moduleInfo->description,
                commands: $this->commandExtractor->extract($moduleInfo),
                queries: $this->queryExtractor->extract($moduleInfo),
                domainEvents: $this->domainEventExtractor->extract($moduleInfo),
                eventSubscribers: $this->eventSubscriberExtractor->extract($moduleInfo),
                externalCalls: $this->externalCallExtractor->extract($moduleInfo),
            );

            $contextModules[$moduleInfo->context][] = $moduleOutput;
        }

        $contexts = [];

        foreach ($contextModules as $contextName => $modules) {
            $contexts[] = new ContextOutput(
                name: $contextName,
                modules: $modules,
            );
        }

        usort($contexts, static fn (ContextOutput $a, ContextOutput $b) => strcmp($a->name, $b->name));

        return new ArchOutput(
            contexts: $contexts,
            meta: new MetaOutput(
                generatedAt: new \DateTimeImmutable(),
                company: $company,
                project: $project,
            ),
        );
    }
}
