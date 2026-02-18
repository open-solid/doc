<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Command;

use OpenSolid\Doc\DocExporter;
use Opis\JsonSchema\Errors\ErrorFormatter;
use Opis\JsonSchema\Validator;
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
        private DocExporter $exporter,
        #[Autowire('%kernel.project_dir%')]
        private string      $projectDir,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Option('Output file path', 'output', 'o')] string $outputFile = 'arch.json',
        #[Option('Pretty print the JSON output', 'p')] bool $pretty = true,
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

        $schemaPath = \dirname(__DIR__, 2).'/arch-schema.json';
        if (!$this->validateSchema($io, $json, $schemaPath)) {
            return Command::FAILURE;
        }

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

    private function validateSchema(SymfonyStyle $io, string $json, string $schemaPath): bool
    {
        if (!file_exists($schemaPath)) {
            $io->warning('Schema file not found: '.$schemaPath);

            return true;
        }

        $data = json_decode($json, false, 512, \JSON_THROW_ON_ERROR);
        $schema = json_decode(file_get_contents($schemaPath), false, 512, \JSON_THROW_ON_ERROR);

        $validator = new Validator();
        $result = $validator->validate($data, $schema);

        if ($result->isValid()) {
            $io->text('<info>✓</info> JSON schema validation passed');

            return true;
        }

        $formatter = new ErrorFormatter();
        $errors = $formatter->format($result->error());

        $io->error('JSON schema validation failed');
        foreach ($errors as $path => $messages) {
            $io->writeln(sprintf('  <comment>%s</comment>:', $path));
            foreach ($messages as $message) {
                $io->writeln(sprintf('    - %s', $message));
            }
        }

        return false;
    }
}
