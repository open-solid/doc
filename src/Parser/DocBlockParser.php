<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Parser;

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
    public function getClassDescription(\ReflectionClass $class): string
    {
        $docComment = $class->getDocComment();

        if (false === $docComment) {
            return '';
        }

        try {
            $docBlock = $this->docBlockFactory->create($docComment);

            return $docBlock->getSummary();
        } catch (\Throwable) {
            return '';
        }
    }

    public function getPropertyDescription(\ReflectionProperty $property): string
    {
        $docComment = $property->getDocComment();

        if (false === $docComment) {
            return '';
        }

        try {
            $docBlock = $this->docBlockFactory->create($docComment);

            return $docBlock->getSummary();
        } catch (\Throwable) {
            return '';
        }
    }

    public function getMethodDescription(\ReflectionMethod $method): string
    {
        $docComment = $method->getDocComment();

        if (false === $docComment) {
            return '';
        }

        try {
            $docBlock = $this->docBlockFactory->create($docComment);

            return $docBlock->getSummary();
        } catch (\Throwable) {
            return '';
        }
    }
}
