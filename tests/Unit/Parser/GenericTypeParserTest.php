<?php

declare(strict_types=1);

namespace OpenSolid\Doc\Tests\Unit\Parser;

use OpenSolid\Doc\Parser\GenericTypeParser;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class GenericTypeParserTest extends TestCase
{
    private GenericTypeParser $parser;

    protected function setUp(): void
    {
        $this->parser = new GenericTypeParser();
    }

    #[Test]
    public function itExtractsSimpleGenericType(): void
    {
        $class = new \ReflectionClass(CommandWithSimpleReturn::class);

        $result = $this->parser->extractGenericType($class);

        self::assertNotNull($result);
        self::assertSame('string', $result['type']);
        self::assertSame('string', $result['class']);
    }

    #[Test]
    public function itExtractsClassGenericType(): void
    {
        $class = new \ReflectionClass(CommandWithClassReturn::class);

        $result = $this->parser->extractGenericType($class);

        self::assertNotNull($result);
        self::assertSame('UserDto', $result['type']);
        self::assertSame('OpenSolid\Doc\Tests\Unit\Parser\UserDto', $result['class']);
    }

    #[Test]
    public function itExtractsArrayGenericType(): void
    {
        $class = new \ReflectionClass(QueryWithArrayReturn::class);

        $result = $this->parser->extractGenericType($class);

        self::assertNotNull($result);
        self::assertSame('array<UserDto>', $result['type']);
    }

    #[Test]
    public function itReturnsNullForClassWithoutDocBlock(): void
    {
        $class = new \ReflectionClass(CommandWithoutDocBlock::class);

        $result = $this->parser->extractGenericType($class);

        self::assertNull($result);
    }

    #[Test]
    public function itReturnsNullForClassWithoutExtendsTag(): void
    {
        $class = new \ReflectionClass(CommandWithoutExtendsTag::class);

        $result = $this->parser->extractGenericType($class);

        self::assertNull($result);
    }
}

// Test fixtures

abstract class BaseCommand
{
}

abstract class BaseQuery
{
}

class UserDto
{
    public function __construct(
        public string $id,
        public string $name,
    ) {
    }
}

/**
 * @extends BaseCommand<string>
 */
class CommandWithSimpleReturn extends BaseCommand
{
}

/**
 * @extends BaseCommand<UserDto>
 */
class CommandWithClassReturn extends BaseCommand
{
}

/**
 * @extends BaseQuery<array<UserDto>>
 */
class QueryWithArrayReturn extends BaseQuery
{
}

class CommandWithoutDocBlock extends BaseCommand
{
}

/**
 * This command has no extends tag.
 */
class CommandWithoutExtendsTag extends BaseCommand
{
}
