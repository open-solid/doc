<?php

use OpenSolid\ArchViewer\Controller\ViewerController;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return static function (RoutingConfigurator $routes): void {
    $routes
        ->add('arch_viewer_controller', '/arch')
            ->controller(ViewerController::class)
            ->methods(['GET'])
    ;
};
