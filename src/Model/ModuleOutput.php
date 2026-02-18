<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Model;

use OpenSolid\Doc\Model\CommandOutput;
use OpenSolid\Doc\Model\DomainEventOutput;
use OpenSolid\Doc\Model\EventSubscriberOutput;
use OpenSolid\Doc\Model\ExternalCallOutput;
use OpenSolid\Doc\Model\QueryOutput;

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
        public ?string $description = null,
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

        if (null !== $this->description) {
            $data['description'] = $this->description;
        }

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
