<?php

namespace OpenSolid\ArchViewer\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class ViewerController
{
    public function __invoke(Request $request): Response
    {
        return new Response('Hello ArchViewer!');
    }
}
