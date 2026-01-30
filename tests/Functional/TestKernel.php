<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Tests\Functional;

use OpenSolid\ArchViewer\ArchViewerBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

final class TestKernel extends Kernel
{
    use MicroKernelTrait;

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

    protected function configureContainer(ContainerConfigurator $container): void
    {
        $container->import(__DIR__.'/config/framework.php');
    }

    protected function configureRoutes(RoutingConfigurator $routes): void
    {
        $routes->import(__DIR__.'/../../config/routes.php');
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
