<?php

use OpenSolid\Doc\DocExporter;
use OpenSolid\Doc\Command\ExportCommand;
use OpenSolid\Doc\Controller\DocController;
use OpenSolid\Doc\Extractor\CommandExtractor;
use OpenSolid\Doc\Extractor\DomainEventExtractor;
use OpenSolid\Doc\Extractor\EventSubscriberExtractor;
use OpenSolid\Doc\Extractor\ExternalCallExtractor;
use OpenSolid\Doc\Extractor\QueryExtractor;
use OpenSolid\Doc\Parser\DocBlockParser;
use OpenSolid\Doc\Parser\GenericTypeParser;
use OpenSolid\Doc\Scanner\ClassScanner;
use OpenSolid\Doc\Scanner\ModuleScanner;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

use function Symfony\Component\DependencyInjection\Loader\Configurator\param;
use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

return static function (ContainerConfigurator $container): void {
    $services = $container->services();

    // Scanners
    $services->set(ModuleScanner::class);
    $services->set(ClassScanner::class);

    // Parsers
    $services->set(DocBlockParser::class);
    $services->set(GenericTypeParser::class);

    // Extractors
    $services->set(CommandExtractor::class)
        ->args([
            service(ClassScanner::class),
            service(DocBlockParser::class),
            service(GenericTypeParser::class),
        ]);

    $services->set(QueryExtractor::class)
        ->args([
            service(ClassScanner::class),
            service(DocBlockParser::class),
            service(GenericTypeParser::class),
        ]);

    $services->set(DomainEventExtractor::class)
        ->args([
            service(ClassScanner::class),
            service(DocBlockParser::class),
        ]);

    $services->set(EventSubscriberExtractor::class)
        ->args([
            service(ClassScanner::class),
            service(DocBlockParser::class),
        ]);

    $services->set(ExternalCallExtractor::class)
        ->args([
            service(ClassScanner::class),
        ]);

    // Main exporter
    $services->set(DocExporter::class)
        ->args([
            service(ModuleScanner::class),
            service(CommandExtractor::class),
            service(QueryExtractor::class),
            service(DomainEventExtractor::class),
            service(EventSubscriberExtractor::class),
            service(ExternalCallExtractor::class),
        ]);

    // Console command
    $services->set('open_solid_doc.arch_export_command', ExportCommand::class)
        ->args([
            service(DocExporter::class),
            param('kernel.project_dir'),
            param('open_solid_doc.company'),
            param('open_solid_doc.project'),
        ])
        ->tag('console.command');

    // Controller
    $services->set(DocController::class)
        ->args([
            service(UrlGeneratorInterface::class),
            service('open_solid_doc.arch_export_command'),
            param('kernel.project_dir').'/arch.json',
            param('kernel.project_dir').'/openapi.json',
            param('open_solid_doc.company'),
            param('open_solid_doc.project'),
            param('open_solid_doc.navigation'),
            param('kernel.project_dir'),
        ])
        ->tag('controller.service_arguments');
};
