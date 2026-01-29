<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class EventSubscriberOutput implements \JsonSerializable
{
    public function __construct(
        public string $name,
        public string $class,
        public string $description,
        public string $event,
        public string $eventClass,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'class' => $this->class,
            'description' => $this->description,
            'event' => $this->event,
            'eventClass' => $this->eventClass,
        ];
    }
}
