<?php

namespace OpenSolid\ArchViewer\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final readonly class ViewerController
{
    public function __construct(
        private UrlGeneratorInterface $urlGenerator,
        private string $archJsonPath,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $archJsonUrl = $this->urlGenerator->generate('arch_json_controller');

        ob_start();
        include __DIR__ . '/../../templates/arch_viewer.html.php';
        $content = ob_get_clean();

        return new Response(content: $content);
    }

    public function archJson(): Response
    {
        return new Response(
            content: file_get_contents($this->archJsonPath),
            headers: ['Content-Type' => 'application/json'],
        );
    }
}
