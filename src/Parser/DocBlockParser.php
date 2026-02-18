<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Parser;

use phpDocumentor\Reflection\DocBlockFactory;
use phpDocumentor\Reflection\DocBlockFactoryInterface;

final readonly class DocBlockParser
{
    private DocBlockFactoryInterface $docBlockFactory;

    public function __construct()
    {
        $this->docBlockFactory = DocBlockFactory::createInstance();
    }

    /**
     * @param \ReflectionClass<object> $class
     */
    public function getClassDescription(\ReflectionClass $class): ?string
    {
        $docComment = $class->getDocComment();

        if (false === $docComment) {
            return null;
        }

        try {
            $docBlock = $this->docBlockFactory->create($docComment);
            $summary = $docBlock->getSummary();

            return '' !== $summary ? $summary : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function getPropertyDescription(\ReflectionProperty $property): ?string
    {
        // First, try to get description from property's own docblock
        $docComment = $property->getDocComment();

        if (false !== $docComment) {
            try {
                $docBlock = $this->docBlockFactory->create($docComment);
                $summary = $docBlock->getSummary();

                if ('' !== $summary) {
                    return $summary;
                }
            } catch (\Throwable) {
                // Continue to check constructor
            }
        }

        // For promoted properties, check constructor's @param tags
        if ($property->isPromoted()) {
            $constructor = $property->getDeclaringClass()->getConstructor();

            if (null !== $constructor) {
                return $this->getParamDescriptionFromDocBlock(
                    $constructor->getDocComment(),
                    $property->getName()
                );
            }
        }

        return null;
    }

    public function getMethodDescription(\ReflectionMethod $method): ?string
    {
        $docComment = $method->getDocComment();

        if (false === $docComment) {
            return null;
        }

        try {
            $docBlock = $this->docBlockFactory->create($docComment);
            $summary = $docBlock->getSummary();

            return '' !== $summary ? $summary : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function getParameterDescription(\ReflectionParameter $parameter): ?string
    {
        $method = $parameter->getDeclaringFunction();

        // Extract from the method's @param tags (constructor or regular method)
        if ($method instanceof \ReflectionMethod) {
            return $this->getParamDescriptionFromDocBlock($method->getDocComment(), $parameter->getName());
        }

        return null;
    }

    private function getParamDescriptionFromDocBlock(string|false $docComment, string $paramName): ?string
    {
        if (false === $docComment) {
            return null;
        }

        try {
            $docBlock = $this->docBlockFactory->create($docComment);
            $paramTags = $docBlock->getTagsByName('param');

            foreach ($paramTags as $tag) {
                if (!$tag instanceof \phpDocumentor\Reflection\DocBlock\Tags\Param) {
                    continue;
                }

                if ($tag->getVariableName() === $paramName) {
                    $description = $tag->getDescription();

                    return null !== $description && '' !== (string) $description ? (string) $description : null;
                }
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }
}
