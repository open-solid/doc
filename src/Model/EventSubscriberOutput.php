<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Model;

final readonly class EventSubscriberOutput implements \JsonSerializable
{
    public function __construct(
        public string $name,
        public string $class,
        public ?string $description,
        public string $event,
        public string $eventClass,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function jsonSerialize(): array
    {
        $data = [
            'name' => $this->name,
            'class' => $this->class,
        ];

        if (null !== $this->description) {
            $data['description'] = $this->description;
        }

        $data['event'] = $this->event;
        $data['eventClass'] = $this->eventClass;

        return $data;
    }
}
