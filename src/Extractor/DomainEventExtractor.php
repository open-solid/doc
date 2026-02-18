<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Extractor;

use OpenSolid\Doc\Model\DomainEventOutput;
use OpenSolid\Doc\Model\ParameterOutput;
use OpenSolid\Doc\Parser\DocBlockParser;
use OpenSolid\Doc\Scanner\ClassScanner;
use OpenSolid\Doc\Scanner\ModuleInfo;
use OpenSolid\Core\Domain\Event\Message\DomainEvent;

final readonly class DomainEventExtractor
{
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
        $addedProperties = [];

        // First, collect properties from parent classes (in order from base to child)
        $parentClasses = [];
        $parent = $class->getParentClass();
        while ($parent && $parent->getName() !== DomainEvent::class) {
            $parentClasses[] = $parent;
            $parent = $parent->getParentClass();
        }
        if ($parent && $parent->getName() === DomainEvent::class) {
            $parentClasses[] = $parent;
        }
        $parentClasses = array_reverse($parentClasses);

        foreach ($parentClasses as $parentClass) {
            foreach ($parentClass->getProperties(\ReflectionProperty::IS_PUBLIC) as $property) {
                if ($property->getDeclaringClass()->getName() !== $parentClass->getName()) {
                    continue;
                }

                $propertyName = $property->getName();
                if (!isset($addedProperties[$propertyName])) {
                    $properties[] = $this->createParameterOutput($property);
                    $addedProperties[$propertyName] = true;
                }
            }
        }

        // Then, collect properties from the current class
        foreach ($class->getProperties(\ReflectionProperty::IS_PUBLIC) as $property) {
            if ($property->getDeclaringClass()->getName() !== $class->getName()) {
                continue;
            }

            $propertyName = $property->getName();
            if (!isset($addedProperties[$propertyName])) {
                $properties[] = $this->createParameterOutput($property);
                $addedProperties[$propertyName] = true;
            }
        }

        return new DomainEventOutput(
            name: $class->getShortName(),
            class: $class->getName(),
            description: $this->docBlockParser->getClassDescription($class),
            properties: $properties,
        );
    }

    private function createParameterOutput(\ReflectionProperty $property): ParameterOutput
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

        return new ParameterOutput(
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
