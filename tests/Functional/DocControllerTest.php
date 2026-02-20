<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Functional;

use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class DocControllerTest extends TestCase
{
    private TestKernel $kernel;

    protected function setUp(): void
    {
        $this->kernel = new TestKernel('test', true);
        $this->kernel->boot();

        // Create a test arch.json file
        file_put_contents(
            $this->kernel->getProjectDir().'/arch.json',
            json_encode(['modules' => []], JSON_THROW_ON_ERROR),
        );
    }

    protected function tearDown(): void
    {
        // Clean up the test arch.json file
        $archJsonPath = $this->kernel->getProjectDir().'/arch.json';
        if (file_exists($archJsonPath)) {
            unlink($archJsonPath);
        }

        $this->kernel->shutdown();
    }

    public function testViewerPageReturnsHtmlResponse(): void
    {
        $request = Request::create('/doc');

        $response = $this->kernel->handle($request);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertStringContainsString('__ARCH_CONFIG__', $response->getContent());
        self::assertStringContainsString('/arch.json', $response->getContent());
    }

    public function testArchJsonReturnsJsonResponse(): void
    {
        $request = Request::create('/arch.json');

        $response = $this->kernel->handle($request);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('application/json', $response->headers->get('Content-Type'));
        self::assertJson($response->getContent());
    }

    public function testNavigationJsonReturnsResolvedTree(): void
    {
        $request = Request::create('/doc/navigation.json');

        $response = $this->kernel->handle($request);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('application/json', $response->headers->get('Content-Type'));

        $data = json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey('navigation', $data);

        $nav = $data['navigation'];
        self::assertCount(1, $nav);
        self::assertSame('Guides', $nav[0]['title']);
        self::assertNull($nav[0]['path']);
        self::assertNull($nav[0]['anchor']);

        // Check nested items
        $items = $nav[0]['items'];
        self::assertCount(2, $items);
        self::assertSame('Introduction', $items[0]['title']);
        self::assertSame('tests/Functional/docs/introduction.md', $items[0]['path']);

        // Anchor-only child inherits parent path
        $children = $items[0]['items'];
        self::assertCount(1, $children);
        self::assertSame('Getting started', $children[0]['title']);
        self::assertSame('tests/Functional/docs/introduction.md', $children[0]['path']);
        self::assertSame('getting-started', $children[0]['anchor']);
    }

    public function testMarkdownContentReturnsFileContent(): void
    {
        $request = Request::create('/doc/content', 'GET', ['path' => 'tests/Functional/docs/introduction.md']);

        $response = $this->kernel->handle($request);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertStringContainsString('text/markdown', $response->headers->get('Content-Type'));
        self::assertStringContainsString('# Introduction', $response->getContent());
    }

    public function testMarkdownContentReturns404ForUnlistedPath(): void
    {
        $request = Request::create('/doc/content', 'GET', ['path' => 'tests/Functional/docs/quickstart.md']);

        $response = $this->kernel->handle($request);

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
    }

    public function testMarkdownContentReturns404ForPathTraversal(): void
    {
        $request = Request::create('/doc/content', 'GET', ['path' => '../../etc/passwd']);

        $response = $this->kernel->handle($request);

        self::assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
    }

    public function testUpdateArchJsonExportsArchitecture(): void
    {
        $request = Request::create('/arch.json', 'POST');

        $response = $this->kernel->handle($request);

        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        self::assertSame('application/json', $response->headers->get('Content-Type'));

        $data = json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey('success', $data);
        self::assertTrue($data['success']);

        // Verify the arch.json file was updated
        $archJsonPath = $this->kernel->getProjectDir().'/arch.json';
        self::assertFileExists($archJsonPath);

        $archData = json_decode(file_get_contents($archJsonPath), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey('contexts', $archData);
    }
}
