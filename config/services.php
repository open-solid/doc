<?php

use OpenSolid\ArchViewer\ArchExporter;
use OpenSolid\ArchViewer\Command\ExportCommand;
use OpenSolid\ArchViewer\Extractor\CommandExtractor;
use OpenSolid\ArchViewer\Extractor\DomainEventExtractor;
use OpenSolid\ArchViewer\Extractor\EventSubscriberExtractor;
use OpenSolid\ArchViewer\Extractor\ExternalCallExtractor;
use OpenSolid\ArchViewer\Extractor\QueryExtractor;
use OpenSolid\ArchViewer\Parser\DocBlockParser;
use OpenSolid\ArchViewer\Parser\GenericTypeParser;
use OpenSolid\ArchViewer\Scanner\ClassScanner;
use OpenSolid\ArchViewer\Scanner\ModuleScanner;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

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
    $services->set(ArchExporter::class)
        ->args([
            service(ModuleScanner::class),
            service(CommandExtractor::class),
            service(QueryExtractor::class),
            service(DomainEventExtractor::class),
            service(EventSubscriberExtractor::class),
            service(ExternalCallExtractor::class),
        ]);

    // Console command
    $services->set('arch_viewer.arch_export_command', ExportCommand::class)
        ->args([
            service(ArchExporter::class),
            param('kernel.project_dir'),
        ])
        ->tag('console.command');
};
