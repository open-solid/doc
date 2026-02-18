<?php

use OpenSolid\Doc\Tests\Functional\TestKernel;
use Symfony\Component\HttpFoundation\Request;

require_once __DIR__.'/../vendor/autoload.php';

$kernel = new TestKernel('test', true);
$kernel->boot();

$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
