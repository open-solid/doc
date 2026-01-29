<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Tests\Functional;

use OpenSolid\ArchViewer\ArchViewerBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Component\Config\Loader\LoaderInterface;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Symfony\Component\HttpKernel\Kernel;

final class TestKernel extends Kernel
{
    public function registerBundles(): iterable
    {
        yield new FrameworkBundle();
        yield new ArchViewerBundle();
        yield new class extends Bundle
        {
            public function shutdown(): void
            {
                restore_exception_handler();
            }
        };
    }

    public function registerContainerConfiguration(LoaderInterface $loader): void
    {
        $loader->load(__DIR__.'/config/framework.php');
    }

    public function getCacheDir(): string
    {
        return sys_get_temp_dir().'/arch_viewer_test/cache';
    }

    public function getLogDir(): string
    {
        return sys_get_temp_dir().'/arch_viewer_test/log';
    }
}
