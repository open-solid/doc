<?php

use OpenSolid\Doc\Controller\DocController;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return static function (RoutingConfigurator $routes): void {
    $routes
        ->add('arch_viewer_controller', '/arch')
            ->controller(DocController::class)
            ->methods(['GET'])

        ->add('arch_json_controller', '/arch.json')
            ->controller(DocController::class.'::archJson')
            ->methods(['GET'])

        ->add('arch_json_update_controller', '/arch.json')
            ->controller(DocController::class.'::updateArchJson')
            ->methods(['POST'])
    ;
};
