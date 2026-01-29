<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Command;

use OpenSolid\ArchViewer\ArchExporter;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(
    name: 'open:arch:export',
    description: 'Export architecture metadata to JSON',
)]
final readonly class ExportCommand
{
    public function __construct(
        private ArchExporter $exporter,
        #[Autowire('%kernel.project_dir%')]
        private string $projectDir,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Option('Output file path', 'output', 'o')] string $outputFile = 'arch.json',
        #[Option('Pretty print the JSON output', 'p')] bool $pretty = false
    ): int {
        $io->title('Architecture Export');

        $srcDir = $this->projectDir.'/src';
        $io->text('Scanning source directory: '.$srcDir);

        $arch = $this->exporter->export($srcDir);

        $jsonFlags = \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR;
        if ($pretty) {
            $jsonFlags |= \JSON_PRETTY_PRINT;
        }
        $json = json_encode($arch, $jsonFlags);

        $outputPath = str_starts_with($outputFile, '/')
            ? $outputFile
            : $this->projectDir.'/'.$outputFile;

        file_put_contents($outputPath, $json."\n");

        $io->success('Architecture exported to: '.$outputPath);

        $contextCount = count($arch->contexts);
        $moduleCount = array_sum(array_map(static fn ($c) => count($c->modules), $arch->contexts));

        $io->table(
            ['Metric', 'Count'],
            [
                ['Contexts', (string) $contextCount],
                ['Modules', (string) $moduleCount],
            ]
        );

        return Command::SUCCESS;
    }
}
