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
        $request = Request::create('/arch');

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
