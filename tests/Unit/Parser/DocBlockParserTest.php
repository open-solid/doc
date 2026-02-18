<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Unit\Parser;

use OpenSolid\Doc\Parser\DocBlockParser;
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

    #[Test]
    public function itReturnsParameterDescriptionFromConstructorDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithParamDocBlock::class);
        $constructor = $class->getConstructor();
        $parameter = $constructor->getParameters()[0];

        $description = $this->parser->getParameterDescription($parameter);

        self::assertSame('The name of the entity.', $description);
    }

    #[Test]
    public function itReturnsNullForParameterWithoutDocBlock(): void
    {
        $class = new \ReflectionClass(ClassWithoutDocBlock::class);
        $constructor = $class->getConstructor();
        $parameter = $constructor->getParameters()[0];

        $description = $this->parser->getParameterDescription($parameter);

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
    public function __construct(
        public string $name,
    ) {
    }
}

/**
 * A class with parameter documentation.
 */
class ClassWithParamDocBlock
{
    /**
     * @param string $name The name of the entity.
     * @param int    $age  The age in years.
     */
    public function __construct(
        public string $name,
        public int $age,
    ) {
    }
}
