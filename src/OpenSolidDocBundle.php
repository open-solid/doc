<?php

namespace OpenSolid\Doc;

use Symfony\Component\Config\Definition\Configurator\DefinitionConfigurator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Bundle\AbstractBundle;

class OpenSolidDocBundle extends AbstractBundle
{
    public function configure(DefinitionConfigurator $definition): void
    {
        $definition->rootNode()
            ->children()
                ->scalarNode('company')->defaultValue('Company')->end()
                ->scalarNode('project')->defaultValue('Project')->end()
            ->end();
    }

    public function loadExtension(array $config, ContainerConfigurator $container, ContainerBuilder $builder): void
    {
        $container->parameters()
            ->set('open_solid_doc.company', $config['company'])
            ->set('open_solid_doc.project', $config['project']);

        $container->import('../config/services.php');
    }
}