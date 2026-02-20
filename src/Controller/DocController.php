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
        private string $openapiJsonPath,
        private string $company,
        private string $project,
        private array $navigation,
        private string $projectDir,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $archJsonUrl = $this->urlGenerator->generate('open_solid_doc_json_controller');
        $archJsonUpdateUrl = $this->urlGenerator->generate('open_solid_doc_json_update_controller');
        $openapiJsonUrl = $this->urlGenerator->generate('open_solid_doc_openapi_json_controller');
        $docsNavigationUrl = $this->urlGenerator->generate('open_solid_doc_docs_navigation_controller');

        ob_start();
        include __DIR__ . '/../../templates/doc.html.php';
        $content = ob_get_clean();

        return new Response(content: $content);
    }

    public function archJson(): JsonResponse
    {
        if (!file_exists($this->archJsonPath)) {
            return new JsonResponse(
                data: ['error' => 'Documentation not found. Please generate it first.'],
                status: Response::HTTP_NOT_FOUND,
            );
        }

        return new JsonResponse(
            data: file_get_contents($this->archJsonPath),
            headers: [
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ],
            json: true,
        );
    }

    public function openapiJson(): JsonResponse
    {
        return new JsonResponse(
            data: file_exists($this->openapiJsonPath) ? file_get_contents($this->openapiJsonPath) : '{}',
            headers: [
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ],
            json: true,
        );
    }

    public function updateArchJson(): JsonResponse
    {
        $io = new SymfonyStyle(new ArrayInput([]), new NullOutput());

        $exitCode = ($this->exportCommand)(io: $io, outputFile: $this->archJsonPath);

        return new JsonResponse(['success' => 0 === $exitCode]);
    }

    public function navigationJson(): JsonResponse
    {
        return new JsonResponse([
            'navigation' => $this->resolveNavigation($this->filterNavigation('general')),
        ]);
    }

    public function navigationJsonByType(string $type): JsonResponse
    {
        $items = $this->filterNavigation($type);

        if (!$items) {
            return new JsonResponse(
                data: ['error' => sprintf('No navigation found for type "%s".', $type)],
                status: Response::HTTP_NOT_FOUND,
            );
        }

        return new JsonResponse([
            'navigation' => $this->resolveNavigation($items),
        ]);
    }

    public function markdownContent(Request $request): Response
    {
        $path = $request->query->get('path', '');

        $allowedPaths = $this->collectPaths($this->navigation);

        if (!in_array($path, $allowedPaths, true)) {
            return new JsonResponse(
                data: ['error' => 'Document not found.'],
                status: Response::HTTP_NOT_FOUND,
            );
        }

        $fullPath = $this->projectDir.'/'.$path;

        if (!is_file($fullPath)) {
            return new JsonResponse(
                data: ['error' => 'Document not found.'],
                status: Response::HTTP_NOT_FOUND,
            );
        }

        return new Response(
            content: file_get_contents($fullPath),
            headers: ['Content-Type' => 'text/markdown'],
        );
    }

    private function filterNavigation(string $type): array
    {
        return array_values(array_filter($this->navigation, static fn (array $item) => ($item['type'] ?? null) === $type));
    }

    private function resolveNavigation(array $items, ?string $parentPath = null): array
    {
        $resolved = [];

        foreach ($items as $item) {
            $path = $item['path'] ?? $parentPath;
            $anchor = $item['anchor'] ?? null;

            if (!isset($item['path']) && isset($item['anchor'])) {
                $path = $parentPath;
            }

            $resolved[] = [
                'title' => $item['title'],
                'path' => isset($item['path']) ? $item['path'] : (isset($item['anchor']) ? $parentPath : null),
                'anchor' => $anchor,
                'items' => isset($item['items']) ? $this->resolveNavigation($item['items'], $path) : [],
            ];
        }

        return $resolved;
    }

    private function collectPaths(array $items): array
    {
        $paths = [];

        foreach ($items as $item) {
            if (isset($item['path'])) {
                $paths[] = $item['path'];
            }
            if (isset($item['items'])) {
                $paths = array_merge($paths, $this->collectPaths($item['items']));
            }
        }

        return array_unique($paths);
    }
}
