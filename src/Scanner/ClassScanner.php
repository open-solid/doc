<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Scanner;

use OpenSolid\ArchViewer\Scanner\ModuleInfo;
use Symfony\Component\Finder\Finder;

final readonly class ClassScanner
{
    /**
     * Scans PHP files in a module and yields ReflectionClass instances.
     *
     * @return \Generator<\ReflectionClass<object>>
     */
    public function scan(ModuleInfo $moduleInfo): \Generator
    {
        $finder = new Finder();
        $finder
            ->files()
            ->in($moduleInfo->path)
            ->name('*.php')
            ->sortByName();

        foreach ($finder as $file) {
            $className = $this->resolveClassName($file->getRealPath());

            if (null === $className) {
                continue;
            }

            if (!class_exists($className)) {
                continue;
            }

            try {
                yield new \ReflectionClass($className);
            } catch (\ReflectionException) {
                continue;
            }
        }
    }

    /**
     * Scans PHP files in a specific subdirectory of a module.
     *
     * @return \Generator<\ReflectionClass<object>>
     */
    public function scanDirectory(ModuleInfo $moduleInfo, string $subdirectory): \Generator
    {
        $path = $moduleInfo->path.\DIRECTORY_SEPARATOR.$subdirectory;

        if (!is_dir($path)) {
            return;
        }

        $finder = new Finder();
        $finder
            ->files()
            ->in($path)
            ->name('*.php')
            ->sortByName();

        foreach ($finder as $file) {
            $className = $this->resolveClassName($file->getRealPath());

            if (null === $className) {
                continue;
            }

            if (!class_exists($className)) {
                continue;
            }

            try {
                yield new \ReflectionClass($className);
            } catch (\ReflectionException) {
                continue;
            }
        }
    }

    private function resolveClassName(string $filePath): ?string
    {
        $content = file_get_contents($filePath);

        if (false === $content) {
            return null;
        }

        $namespace = null;
        $className = null;

        $tokens = token_get_all($content);
        $count = count($tokens);

        for ($i = 0; $i < $count; ++$i) {
            if (!is_array($tokens[$i])) {
                continue;
            }

            if (T_NAMESPACE === $tokens[$i][0]) {
                $namespace = '';
                for (++$i; $i < $count; ++$i) {
                    if (is_array($tokens[$i])) {
                        if (in_array($tokens[$i][0], [T_NAME_QUALIFIED, T_STRING], true)) {
                            $namespace .= $tokens[$i][1];
                        }
                    } elseif (';' === $tokens[$i] || '{' === $tokens[$i]) {
                        break;
                    }
                }
            }

            if (in_array($tokens[$i][0], [T_CLASS, T_INTERFACE, T_TRAIT, T_ENUM], true)) {
                for (++$i; $i < $count; ++$i) {
                    if (is_array($tokens[$i]) && T_STRING === $tokens[$i][0]) {
                        $className = $tokens[$i][1];
                        break 2;
                    }
                }
            }
        }

        if (null === $className) {
            return null;
        }

        if (null !== $namespace) {
            return $namespace.'\\'.$className;
        }

        return $className;
    }
}
