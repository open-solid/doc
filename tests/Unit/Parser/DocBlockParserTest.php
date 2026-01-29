<?php

declare(strict_types=1);

namespace OpenSolid\ArchViewer\Tests\Unit\Parser;

use OpenSolid\ArchViewer\Parser\DocBlockParser;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class DocBlockParserTest extends TestCase
{
    private DocBlockParser $parser;

    protected function setUp(): void
    {
        $this->parser = new DocBlockParser();
    }

    #[Test]
    public function itReturnsClassDescriptionFromDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithDocBlock::class);

        $description = $this->parser->getClassDescription($class);

        self::assertSame('This is a test class with documentation.', $description);
    }

    #[Test]
    public function itReturnsNullForClassWithoutDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithoutDocBlock::class);

        $description = $this->parser->getClassDescription($class);

        self::assertNull($description);
    }

    #[Test]
    public function itReturnsPropertyDescriptionFromDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithDocBlock::class);
        $property = $class->getProperty('documentedProperty');

        $description = $this->parser->getPropertyDescription($property);

        self::assertSame('This property has documentation.', $description);
    }

    #[Test]
    public function itReturnsNullForPropertyWithoutDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithDocBlock::class);
        $property = $class->getProperty('undocumentedProperty');

        $description = $this->parser->getPropertyDescription($property);

        self::assertNull($description);
    }

    #[Test]
    public function itReturnsMethodDescriptionFromDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithDocBlock::class);
        $method = $class->getMethod('documentedMethod');

        $description = $this->parser->getMethodDescription($method);

        self::assertSame('This method has documentation.', $description);
    }

    #[Test]
    public function itReturnsNullForMethodWithoutDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithDocBlock::class);
        $method = $class->getMethod('undocumentedMethod');

        $description = $this->parser->getMethodDescription($method);

        self::assertNull($description);
    }
}

/**
 * This is a test class with documentation.
 */
class ClassWithDocBlock
{
    /**
     * This property has documentation.
     */
    public string $documentedProperty;

    public string $undocumentedProperty;

    /**
     * This method has documentation.
     */
    public function documentedMethod(): void
    {
    }

    public function undocumentedMethod(): void
    {
    }
}

class ClassWithoutDocBlock
{
}
