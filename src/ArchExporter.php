<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer;

use OpenSolid\ArchViewer\Extractor\CommandExtractor;
use OpenSolid\ArchViewer\Extractor\DomainEventExtractor;
use OpenSolid\ArchViewer\Extractor\EventSubscriberExtractor;
use OpenSolid\ArchViewer\Extractor\ExternalCallExtractor;
use OpenSolid\ArchViewer\Extractor\QueryExtractor;
use OpenSolid\ArchViewer\Model\ArchOutput;
use OpenSolid\ArchViewer\Model\ContextOutput;
use OpenSolid\ArchViewer\Model\MetaOutput;
use OpenSolid\ArchViewer\Model\ModuleOutput;
use OpenSolid\ArchViewer\Scanner\ModuleScanner;

final readonly class ArchExporter
{
    public function __construct(
        private ModuleScanner $moduleScanner,
        private CommandExtractor $commandExtractor,
        private QueryExtractor $queryExtractor,
        private DomainEventExtractor $domainEventExtractor,
        private EventSubscriberExtractor $eventSubscriberExtractor,
        private ExternalCallExtractor $externalCallExtractor,
    ) {
    }

    public function export(string $srcDir, string $projectName = 'club-api'): ArchOutput
    {
        /** @var ModuleOutput[] $contextModules */
        $contextModules = [];

        foreach ($this->moduleScanner->scan($srcDir) as $moduleInfo) {
            $moduleOutput = new ModuleOutput(
                name: $moduleInfo->module,
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
                project: $projectName,
            ),
        );
    }
}
