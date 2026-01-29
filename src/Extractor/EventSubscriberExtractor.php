<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Extractor;

use OpenSolid\ArchViewer\Model\EventSubscriberOutput;
use OpenSolid\ArchViewer\Parser\DocBlockParser;
use OpenSolid\ArchViewer\Scanner\ClassScanner;
use OpenSolid\ArchViewer\Scanner\ModuleInfo;
use OpenSolid\Core\Infrastructure\Bus\Event\Subscriber\Attribute\AsDomainEventSubscriber;

final readonly class EventSubscriberExtractor
{
    public function __construct(
        private ClassScanner $classScanner,
        private DocBlockParser $docBlockParser,
    ) {
    }

    /**
     * @return list<EventSubscriberOutput>
     */
    public function extract(ModuleInfo $moduleInfo): array
    {
        $subscribers = [];

        foreach ($this->classScanner->scanDirectory($moduleInfo, 'Infrastructure') as $class) {
            $attributes = $class->getAttributes(AsDomainEventSubscriber::class);

            if ([] === $attributes) {
                continue;
            }

            $subscriber = $this->createEventSubscriberOutput($class);

            if (null !== $subscriber) {
                $subscribers[] = $subscriber;
            }
        }

        return $subscribers;
    }

    /**
     * @param \ReflectionClass<object> $class
     */
    private function createEventSubscriberOutput(\ReflectionClass $class): ?EventSubscriberOutput
    {
        $invokeMethod = $class->hasMethod('__invoke') ? $class->getMethod('__invoke') : null;

        if (null === $invokeMethod) {
            return null;
        }

        $parameters = $invokeMethod->getParameters();

        if ([] === $parameters) {
            return null;
        }

        $firstParam = $parameters[0];
        $eventType = $firstParam->getType();

        if (!$eventType instanceof \ReflectionNamedType) {
            return null;
        }

        $eventClass = $eventType->getName();
        $eventName = $this->getShortTypeName($eventClass);

        return new EventSubscriberOutput(
            name: $class->getShortName(),
            class: $class->getName(),
            description: $this->docBlockParser->getClassDescription($class),
            event: $eventName,
            eventClass: $eventClass,
        );
    }

    private function getShortTypeName(string $type): string
    {
        if (str_contains($type, '\\')) {
            $parts = explode('\\', $type);

            return end($parts);
        }

        return $type;
    }
}
