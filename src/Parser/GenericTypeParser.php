<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Parser;

use OpenSolid\Core\Application\Command\Message\Command;
use PHPStan\PhpDocParser\Lexer\Lexer;
use PHPStan\PhpDocParser\Parser\ConstExprParser;
use PHPStan\PhpDocParser\Parser\PhpDocParser;
use PHPStan\PhpDocParser\Parser\TokenIterator;
use PHPStan\PhpDocParser\Parser\TypeParser;
use PHPStan\PhpDocParser\ParserConfig;

final readonly class GenericTypeParser
{
    private Lexer $lexer;
    private PhpDocParser $phpDocParser;

    public function __construct()
    {
        $config = new ParserConfig([]);
        $this->lexer = new Lexer($config);
        $constExprParser = new ConstExprParser($config);
        $typeParser = new TypeParser($config, $constExprParser);
        $this->phpDocParser = new PhpDocParser($config, $typeParser, $constExprParser);
    }

    /**
     * Extracts the return type from @extends Command<T> or @extends Query<T> docblock.
     *
     * @param \ReflectionClass<object> $class
     *
     * @return array{type: string, class: string}|null
     */
    public function extractGenericType(\ReflectionClass $class): ?array
    {
        $docComment = $class->getDocComment();

        if (false === $docComment) {
            return null;
        }

        $tokens = new TokenIterator($this->lexer->tokenize($docComment));
        $phpDocNode = $this->phpDocParser->parse($tokens);

        foreach ($phpDocNode->getExtendsTagValues() as $extendsTag) {
            $type = $extendsTag->type;

            $genericArgs = $type->genericTypes;

            if ([] === $genericArgs) {
                continue;
            }

            $returnType = (string) $genericArgs[0];

            return [
                'type' => $this->extractShortName($returnType),
                'class' => $this->resolveFullClassName($returnType, $class),
            ];
        }

        return null;
    }

    private function extractShortName(string $type): string
    {
        if (str_contains($type, '<')) {
            $basePart = substr($type, 0, strpos($type, '<'));
            $genericPart = substr($type, strpos($type, '<'));

            return $this->getBaseName($basePart).$genericPart;
        }

        return $this->getBaseName($type);
    }

    private function getBaseName(string $fqcn): string
    {
        $parts = explode('\\', ltrim($fqcn, '\\'));

        return end($parts);
    }

    /**
     * @param \ReflectionClass<object> $contextClass
     */
    private function resolveFullClassName(string $type, \ReflectionClass $contextClass): string
    {
        if (str_contains($type, '<')) {
            $basePart = substr($type, 0, strpos($type, '<'));

            return $this->resolveClassName($basePart, $contextClass);
        }

        return $this->resolveClassName($type, $contextClass);
    }

    /**
     * @param \ReflectionClass<object> $contextClass
     */
    private function resolveClassName(string $className, \ReflectionClass $contextClass): string
    {
        if (str_starts_with($className, '\\')) {
            return ltrim($className, '\\');
        }

        if ($this->isBuiltinType($className)) {
            return $className;
        }

        $fileName = $contextClass->getFileName();

        if (false === $fileName) {
            return $className;
        }

        $content = file_get_contents($fileName);

        if (false === $content) {
            return $className;
        }

        $useStatements = $this->parseUseStatements($content);
        $shortName = $this->getBaseName($className);

        if (isset($useStatements[$shortName])) {
            return $useStatements[$shortName];
        }

        $namespace = $contextClass->getNamespaceName();

        if ('' !== $namespace) {
            return $namespace.'\\'.$className;
        }

        return $className;
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
                $shortName = $alias ?? $this->getBaseName($className);
                $useStatements[$shortName] = ltrim($className, '\\');
            }
        }

        return $useStatements;
    }

    private function isBuiltinType(string $type): bool
    {
        return in_array(strtolower($type), [
            'int', 'integer', 'float', 'double', 'string', 'bool', 'boolean',
            'array', 'object', 'callable', 'iterable', 'resource', 'null',
            'void', 'mixed', 'never', 'true', 'false',
        ], true);
    }
}
