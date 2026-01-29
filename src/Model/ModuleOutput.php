<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

use OpenSolid\ArchViewer\Model\CommandOutput;
use OpenSolid\ArchViewer\Model\DomainEventOutput;
use OpenSolid\ArchViewer\Model\EventSubscriberOutput;
use OpenSolid\ArchViewer\Model\ExternalCallOutput;
use OpenSolid\ArchViewer\Model\QueryOutput;

final readonly class ModuleOutput implements \JsonSerializable
{
    /**
     * @param list<CommandOutput>         $commands
     * @param list<QueryOutput>           $queries
     * @param list<DomainEventOutput>     $domainEvents
     * @param list<EventSubscriberOutput> $eventSubscribers
     * @param list<ExternalCallOutput>    $externalCalls
     */
    public function __construct(
        public string $name,
        public array $commands = [],
        public array $queries = [],
        public array $domainEvents = [],
        public array $eventSubscribers = [],
        public array $externalCalls = [],
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        $data = ['name' => $this->name];

        if ([] !== $this->commands) {
            $data['commands'] = $this->commands;
        }

        if ([] !== $this->queries) {
            $data['queries'] = $this->queries;
        }

        if ([] !== $this->domainEvents) {
            $data['domainEvents'] = $this->domainEvents;
        }

        if ([] !== $this->eventSubscribers) {
            $data['eventSubscribers'] = $this->eventSubscribers;
        }

        if ([] !== $this->externalCalls) {
            $data['externalCalls'] = $this->externalCalls;
        }

        return $data;
    }
}
