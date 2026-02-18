<?php

namespace OpenSolid\Doc\Controller;

use OpenSolid\Doc\Command\ExportCommand;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final readonly class DocController
{
    public function __construct(
        private UrlGeneratorInterface $urlGenerator,
        private ExportCommand $exportCommand,
        private string $archJsonPath,
        private string $company,
        private string $project,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $archJsonUrl = $this->urlGenerator->generate('arch_json_controller');
        $archJsonUpdateUrl = $this->urlGenerator->generate('arch_json_update_controller');

        ob_start();
        include __DIR__ . '/../../templates/doc.html.php';
        $content = ob_get_clean();

        return new Response(content: $content);
    }

    public function archJson(): Response
    {
        return new Response(
            content: file_get_contents($this->archJsonPath),
            headers: [
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ],
        );
    }

    public function updateArchJson(): JsonResponse
    {
        $io = new SymfonyStyle(new ArrayInput([]), new NullOutput());

        $exitCode = ($this->exportCommand)(io: $io, outputFile: $this->archJsonPath);

        return new JsonResponse(['success' => 0 === $exitCode]);
    }
}
