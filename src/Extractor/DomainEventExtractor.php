<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Extractor;

use OpenSolid\ArchViewer\Model\DomainEventOutput;
use OpenSolid\ArchViewer\Model\EventPropertyOutput;
use OpenSolid\ArchViewer\Parser\DocBlockParser;
use OpenSolid\ArchViewer\Scanner\ClassScanner;
use OpenSolid\ArchViewer\Scanner\ModuleInfo;
use OpenSolid\Core\Domain\Event\Message\DomainEvent;

final readonly class DomainEventExtractor
{
    private const array INHERITED_PROPERTIES = ['id', 'aggregateId', 'occurredOn'];

    public function __construct(
        private ClassScanner $classScanner,
        private DocBlockParser $docBlockParser,
    ) {
    }

    /**
     * @return list<DomainEventOutput>
     */
    public function extract(ModuleInfo $moduleInfo): array
    {
        $events = [];

        foreach ($this->classScanner->scanDirectory($moduleInfo, 'Domain') as $class) {
            if (!$class->isSubclassOf(DomainEvent::class)) {
                continue;
            }

            if ($class->isAbstract()) {
                continue;
            }

            $events[] = $this->createDomainEventOutput($class);
        }

        return $events;
    }

    private function createDomainEventOutput(\ReflectionClass $class): DomainEventOutput
    {
        $properties = [];

        foreach ($class->getProperties(\ReflectionProperty::IS_PUBLIC) as $property) {
            if (in_array($property->getName(), self::INHERITED_PROPERTIES, true)) {
                continue;
            }

            if ($property->getDeclaringClass()->getName() !== $class->getName()) {
                continue;
            }

            $properties[] = $this->createEventPropertyOutput($property);
        }

        return new DomainEventOutput(
            name: $class->getShortName(),
            class: $class->getName(),
            description: $this->docBlockParser->getClassDescription($class),
            properties: $properties,
        );
    }

    private function createEventPropertyOutput(\ReflectionProperty $property): EventPropertyOutput
    {
        $type = $property->getType();
        $typeName = 'mixed';

        if ($type instanceof \ReflectionNamedType) {
            $typeName = $type->getName();
        } elseif ($type instanceof \ReflectionUnionType || $type instanceof \ReflectionIntersectionType) {
            $types = [];
            foreach ($type->getTypes() as $t) {
                if ($t instanceof \ReflectionNamedType) {
                    $types[] = $t->getName();
                }
            }
            $typeName = implode('|', $types);
        }

        return new EventPropertyOutput(
            name: $property->getName(),
            type: $this->getShortTypeName($typeName),
            description: $this->docBlockParser->getPropertyDescription($property),
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
