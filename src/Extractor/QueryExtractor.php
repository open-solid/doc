<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Extractor;

use OpenSolid\ArchViewer\Model\OutputTypeOutput;
use OpenSolid\ArchViewer\Model\ParameterOutput;
use OpenSolid\ArchViewer\Model\QueryOutput;
use OpenSolid\ArchViewer\Parser\DocBlockParser;
use OpenSolid\ArchViewer\Parser\GenericTypeParser;
use OpenSolid\ArchViewer\Scanner\ClassScanner;
use OpenSolid\ArchViewer\Scanner\ModuleInfo;
use OpenSolid\Core\Application\Query\Message\Query;

final readonly class QueryExtractor
{
    public function __construct(
        private ClassScanner $classScanner,
        private DocBlockParser $docBlockParser,
        private GenericTypeParser $genericTypeParser,
    ) {
    }

    /**
     * @return list<QueryOutput>
     */
    public function extract(ModuleInfo $moduleInfo): array
    {
        $queries = [];

        foreach ($this->classScanner->scanDirectory($moduleInfo, 'Application') as $class) {
            if (!$class->isSubclassOf(Query::class)) {
                continue;
            }

            if ($class->isAbstract()) {
                continue;
            }

            $queries[] = $this->createQueryOutput($class);
        }

        return $queries;
    }

    private function createQueryOutput(\ReflectionClass $class): QueryOutput
    {
        $constructor = $class->getConstructor();
        $input = [];

        if (null !== $constructor) {
            foreach ($constructor->getParameters() as $parameter) {
                $input[] = $this->createParameterOutput($parameter);
            }
        }

        $genericType = $this->genericTypeParser->extractGenericType($class);
        $output = new OutputTypeOutput(
            type: $genericType['type'] ?? 'mixed',
            class: $genericType['class'] ?? 'mixed',
        );

        return new QueryOutput(
            name: $class->getShortName(),
            class: $class->getName(),
            description: $this->docBlockParser->getClassDescription($class),
            input: $input,
            output: $output,
        );
    }

    private function createParameterOutput(\ReflectionParameter $parameter): ParameterOutput
    {
        $type = $parameter->getType();
        $typeName = 'mixed';
        $className = 'mixed';

        if ($type instanceof \ReflectionNamedType) {
            $typeName = $type->getName();
            $className = $type->isBuiltin() ? $typeName : $type->getName();
        } elseif ($type instanceof \ReflectionUnionType || $type instanceof \ReflectionIntersectionType) {
            $types = [];
            foreach ($type->getTypes() as $t) {
                if ($t instanceof \ReflectionNamedType) {
                    $types[] = $t->getName();
                }
            }
            $typeName = implode('|', $types);
            $className = $typeName;
        }

        return new ParameterOutput(
            name: $parameter->getName(),
            type: $this->getShortTypeName($typeName),
            class: $className,
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
