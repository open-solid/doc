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
                'type' => 'doc',
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
            [
                'title' => 'Property',
                'type' => 'module',
                'items' => [
                    [
                        'title' => 'Ubiquitous language',
                        'path' => 'tests/Functional/docs/specs/catalog/property/domain/ubiquitous-language.md',
                    ],
                    [
                        'title' => 'Business rules',
                        'path' => 'tests/Functional/docs/specs/catalog/property/domain/business-rules.md',
                    ],
                    [
                        'title' => 'Models',
                        'path' => 'tests/Functional/docs/specs/catalog/property/domain/models.md',
                    ],
                    [
                        'title' => 'Use-cases',
                        'path' => 'tests/Functional/docs/specs/catalog/property/application/use-cases.md',
                    ],
                    [
                        'title' => 'Integration',
                        'path' => 'tests/Functional/docs/specs/catalog/property/infrastructure/integration.md',
                    ],
                    [
                        'title' => 'API',
                        'path' => 'tests/Functional/docs/specs/catalog/property/presentation/api.md',
                    ],
                    [
                        'title' => 'Console',
                        'path' => 'tests/Functional/docs/specs/catalog/property/presentation/console.md',
                    ],
                    [
                        'title' => 'Webhook',
                        'path' => 'tests/Functional/docs/specs/catalog/property/presentation/webhook.md',
                    ],
                ],
            ],
        ],
    ]);

    $container->services()
        ->set('logger', NullLogger::class);
};
