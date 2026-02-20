<?php

use OpenSolid\Doc\Controller\DocController;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return static function (RoutingConfigurator $routes): void {
    $routes
        ->add('open_solid_doc_controller', '/doc')
            ->controller(DocController::class)
            ->methods(['GET'])

        ->add('open_solid_doc_docs_navigation_controller', '/doc/navigation.json')
            ->controller(DocController::class.'::navigationJson')
            ->methods(['GET'])

        ->add('open_solid_doc_docs_content_controller', '/doc/content')
            ->controller(DocController::class.'::markdownContent')
            ->methods(['GET'])

        ->add('open_solid_doc_json_controller', '/arch.json')
            ->controller(DocController::class.'::archJson')
            ->methods(['GET'])

        ->add('open_solid_doc_json_update_controller', '/arch.json')
            ->controller(DocController::class.'::updateArchJson')
            ->methods(['POST'])

        ->add('open_solid_doc_openapi_json_controller', '/openapi.json')
            ->controller(DocController::class.'::openapiJson')
            ->methods(['GET'])
    ;
};
