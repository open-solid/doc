<?php

use Psr\Log\NullLogger;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

return static function (ContainerConfigurator $container): void {
    $container->extension('framework', [
        'test' => true,
        'secret' => 'test',
        'http_method_override' => false,
        'handle_all_throwables' => true,
        'php_errors' => [
            'log' => true,
        ],
    ]);

    $container->extension('open_solid_doc', [
        'company' => 'test-company',
        'project' => 'test-project',
        'navigation' => [
            [
                'title' => 'Guides',
                'items' => [
                    [
                        'title' => 'Introduction',
                        'path' => 'tests/Functional/docs/introduction.md',
                        'items' => [
                            ['title' => 'Getting started', 'anchor' => 'getting-started'],
                        ],
                    ],
                    [
                        'title' => 'Quickstart',
                        'path' => 'tests/Functional/docs/quickstart.md',
                        'items' => [
                            ['title' => 'What\'s next?', 'anchor' => 'whats-next'],
                        ],
                    ],
                    [
                        'title' => 'SDKs',
                        'path' => 'tests/Functional/docs/sdk/README.md',
                    ],
                ],
            ],
        ],
    ]);

    $container->services()
        ->set('logger', NullLogger::class);
};
