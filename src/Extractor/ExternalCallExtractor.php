<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Extractor;

use OpenSolid\Doc\Model\ExternalCallOutput;
use OpenSolid\Doc\Scanner\ClassScanner;
use OpenSolid\Doc\Scanner\ModuleInfo;
use OpenSolid\Core\Application\Command\Bus\CommandBus;
use OpenSolid\Core\Application\Command\Message\Command;
use OpenSolid\Core\Application\Query\Bus\QueryBus;
use OpenSolid\Core\Application\Query\Message\Query;

final readonly class ExternalCallExtractor
{
    public function __construct(
        private ClassScanner $classScanner,
    ) {
    }

    /**
     * @return list<ExternalCallOutput>
     */
    public function extract(ModuleInfo $moduleInfo): array
    {
        $externalCalls = [];

        foreach ($this->classScanner->scan($moduleInfo) as $class) {
            $calls = $this->extractFromClass($class, $moduleInfo);

            foreach ($calls as $call) {
                $externalCalls[] = $call;
            }
        }

        return $externalCalls;
    }

    /**
     * @param \ReflectionClass<object> $class
     *
     * @return list<ExternalCallOutput>
     */
    private function extractFromClass(\ReflectionClass $class, ModuleInfo $moduleInfo): array
    {
        if (!$this->hasMessageBusDependency($class)) {
            return [];
        }

        $filePath = $class->getFileName();

        if (false === $filePath) {
            return [];
        }

        $content = file_get_contents($filePath);

        if (false === $content) {
            return [];
        }

        $useStatements = $this->parseUseStatements($content);
        $newCalls = $this->findNewMessageCalls($content);
        $externalCalls = [];

        foreach ($newCalls as $className) {
            $fqcn = $this->resolveClassName($className, $useStatements, $class);

            if (!class_exists($fqcn)) {
                continue;
            }

            $targetInfo = $this->extractContextAndModule($fqcn);

            if (null === $targetInfo) {
                continue;
            }

            if ($targetInfo['context'] === $moduleInfo->context && $targetInfo['module'] === $moduleInfo->module) {
                continue;
            }

            $type = $this->determineCallType($fqcn);

            if (null === $type) {
                continue;
            }

            $externalCalls[] = new ExternalCallOutput(
                type: $type,
                source: $class->getShortName(),
                sourceClass: $class->getName(),
                name: $this->getShortTypeName($fqcn),
                targetClass: $fqcn,
                targetContext: $targetInfo['context'],
                targetModule: $targetInfo['module'],
            );
        }

        return $externalCalls;
    }

    /**
     * @param \ReflectionClass<object> $class
     */
    private function hasMessageBusDependency(\ReflectionClass $class): bool
    {
        $constructor = $class->getConstructor();

        if (null === $constructor) {
            return false;
        }

        foreach ($constructor->getParameters() as $parameter) {
            $type = $parameter->getType();

            if (!$type instanceof \ReflectionNamedType) {
                continue;
            }

            $typeName = $type->getName();

            if (CommandBus::class === $typeName || QueryBus::class === $typeName) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<string, string>
     */
    private function parseUseStatements(string $content): array
    {
        $useStatements = [];
        $tokens = token_get_all($content);
        $count = count($tokens);

        for ($i = 0; $i < $count; ++$i) {
            if (!is_array($tokens[$i])) {
                continue;
            }

            if (T_USE !== $tokens[$i][0]) {
                continue;
            }

            $className = '';
            $alias = null;

            for (++$i; $i < $count; ++$i) {
                $token = $tokens[$i];

                if (';' === $token) {
                    break;
                }

                if (is_array($token)) {
                    if (T_NAME_QUALIFIED === $token[0] || T_STRING === $token[0]) {
                        $className .= $token[1];
                    } elseif (T_AS === $token[0]) {
                        for (++$i; $i < $count; ++$i) {
                            if (is_array($tokens[$i]) && T_STRING === $tokens[$i][0]) {
                                $alias = $tokens[$i][1];
                                break;
                            }
                        }
                    }
                }
            }

            if ('' !== $className) {
                $shortName = $alias ?? $this->getShortTypeName($className);
                $useStatements[$shortName] = ltrim($className, '\\');
            }
        }

        return $useStatements;
    }

    /**
     * @return list<string>
     */
    private function findNewMessageCalls(string $content): array
    {
        $calls = [];
        $tokens = token_get_all($content);
        $count = count($tokens);

        for ($i = 0; $i < $count; ++$i) {
            if (!is_array($tokens[$i])) {
                continue;
            }

            if (T_NEW !== $tokens[$i][0]) {
                continue;
            }

            $className = '';

            for (++$i; $i < $count; ++$i) {
                $token = $tokens[$i];

                if (is_array($token)) {
                    if (in_array($token[0], [T_NAME_QUALIFIED, T_NAME_FULLY_QUALIFIED, T_STRING], true)) {
                        $className .= $token[1];
                    } elseif (T_WHITESPACE !== $token[0]) {
                        break;
                    }
                } elseif ('(' === $token || ';' === $token) {
                    break;
                }
            }

            if ('' !== $className) {
                $calls[] = $className;
            }
        }

        return array_unique($calls);
    }

    /**
     * @param array<string, string>    $useStatements
     * @param \ReflectionClass<object> $contextClass
     */
    private function resolveClassName(string $className, array $useStatements, \ReflectionClass $contextClass): string
    {
        if (str_starts_with($className, '\\')) {
            return ltrim($className, '\\');
        }

        $shortName = $this->getShortTypeName($className);

        if (isset($useStatements[$shortName])) {
            return $useStatements[$shortName];
        }

        if (str_contains($className, '\\')) {
            $firstPart = substr($className, 0, strpos($className, '\\'));

            if (isset($useStatements[$firstPart])) {
                return $useStatements[$firstPart].substr($className, strpos($className, '\\'));
            }
        }

        $namespace = $contextClass->getNamespaceName();

        if ('' !== $namespace) {
            return $namespace.'\\'.$className;
        }

        return $className;
    }

    /**
     * @return array{context: string, module: string}|null
     */
    private function extractContextAndModule(string $fqcn): ?array
    {
        if (!str_starts_with($fqcn, 'App\\')) {
            return null;
        }

        $parts = explode('\\', $fqcn);

        if (count($parts) < 3) {
            return null;
        }

        return [
            'context' => $parts[1],
            'module' => $parts[2],
        ];
    }

    private function determineCallType(string $fqcn): ?string
    {
        if (!class_exists($fqcn)) {
            return null;
        }

        $reflection = new \ReflectionClass($fqcn);

        if ($reflection->isSubclassOf(Command::class)) {
            return 'command';
        }

        if ($reflection->isSubclassOf(Query::class)) {
            return 'query';
        }

        return null;
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
