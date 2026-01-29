<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Scanner;

use OpenSolid\ArchViewer\Scanner\ModuleInfo;
use OpenSolid\Core\Infrastructure\Symfony\Module\ModuleExtension;
use Symfony\Component\Finder\Finder;

final readonly class ModuleScanner implements ModuleScannerInterface
{
    /**
     * Scans for modules by finding *Extension.php files that extend ModuleExtension.
     *
     * @return \Generator<ModuleInfo>
     */
    public function scan(string $srcDir): \Generator
    {
        $finder = new Finder();
        $finder
            ->files()
            ->in($srcDir)
            ->exclude('Core')
            ->name('*Extension.php')
            ->sortByName();

        foreach ($finder as $file) {
            $relativePath = $file->getRelativePathname();

            $pathParts = explode(\DIRECTORY_SEPARATOR, $relativePath);

            if (count($pathParts) < 4) {
                continue;
            }

            $context = $pathParts[0];
            $module = $pathParts[1];

            $className = $this->resolveClassName($file->getRealPath(), $context, $module);

            if (null === $className) {
                continue;
            }

            if (!class_exists($className)) {
                continue;
            }

            $reflection = new \ReflectionClass($className);

            if (!$reflection->isSubclassOf(ModuleExtension::class)) {
                continue;
            }

            $modulePath = dirname($file->getRealPath(), 2);

            yield new ModuleInfo(
                context: $context,
                module: $module,
                path: $modulePath,
            );
        }
    }

    private function resolveClassName(string $filePath, string $context, string $module): ?string
    {
        $content = file_get_contents($filePath);

        if (false === $content) {
            return null;
        }

        if (preg_match('/namespace\s+([^;]+);/', $content, $matches)) {
            $namespace = $matches[1];
            $className = pathinfo($filePath, PATHINFO_FILENAME);

            return $namespace.'\\'.$className;
        }

        return 'App\\'.$context.'\\'.$module.'\\Infrastructure\\'.$module.'Extension';
    }
}
