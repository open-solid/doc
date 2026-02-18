# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenSolid Doc** (`open-solid/doc`) is a Symfony bundle that generates interactive architecture documentation for OpenSolid projects. It has two parts: a PHP backend that analyzes code via reflection and produces `arch.json`, and a React/TypeScript SPA that visualizes it.

## Commands

### Frontend (SPA)

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build → templates/doc.html.php
npm run watch      # Watch mode build
npm run lint       # ESLint for spa/
```

### Backend (PHP)

```bash
composer install                   # Install PHP dependencies
./vendor/bin/phpunit               # Run all tests
./vendor/bin/phpunit tests/Unit/   # Run specific test directory
```

## Architecture

### Backend (`src/`)

The bundle scans a Symfony project's source code using PHP reflection to extract DDD artifacts:

- **`DocExporter`** — Orchestrator that coordinates all extractors and produces the final `ArchOutput`
- **Scanners** (`Scanner/`) — `ModuleScanner` discovers bounded contexts and modules from the directory structure; `ClassScanner` finds classes within modules
- **Extractors** (`Extractor/`) — Specialized per artifact type: `CommandExtractor`, `QueryExtractor`, `DomainEventExtractor`, `EventSubscriberExtractor`, `ExternalCallExtractor`
- **Parsers** (`Parser/`) — `DocBlockParser` for PHPDoc metadata, `GenericTypeParser` for phpstan-based type resolution
- **Models** (`Model/`) — Readonly DTOs (`ArchOutput`, `ContextOutput`, `ModuleOutput`, etc.) serialized to JSON

**Routes** (defined in `config/routes.php`):
- `GET /arch` — Serves the SPA
- `GET /arch.json` — Returns architecture data
- `POST /arch.json` — Triggers re-export

### Frontend (`spa/`)

React 19 SPA built with Vite. The build uses `vite-plugin-singlefile` to produce a single self-contained HTML file, then a custom `phpTemplatePlugin` in `spa/vite.config.ts` converts it to `templates/doc.html.php` with PHP template variables (`$archJsonUrl`, `$archJsonUpdateUrl`).

**State management** uses React Context (no external library):
- `ArchDataContext` — Fetches and caches architecture JSON, handles refresh
- `NavigationContext` — Manages view state (overview vs. module detail)
- `ThemeContext` — Light/dark mode with system preference detection

**Component structure**: Two main views — `OverviewPage` (stats grid, context cards, context map) and `ModulePage` (tabbed detail with commands, queries, events, subscribers, external calls).

**Types** are defined in `spa/src/types.ts`. The core data shape:
```
ArchData → Context[] → Module[] → {commands, queries, domainEvents, eventSubscribers, externalCalls}
```

## Key Conventions

- PHP models use `readonly` classes as immutable value objects
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- Tailwind CSS v4 for styling with dark mode via `dark:` prefix
- Custom hooks pattern: `useArchData()`, `useNavigation()`, `useTheme()`
- PHP services are configured explicitly in `config/services.php` (no autowiring)
