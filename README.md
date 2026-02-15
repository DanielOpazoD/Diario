# Medidiario AI

> Sistema de gestión clínica diaria para médicos hospitalarios. PWA offline-first con sincronización Firebase y extracción inteligente de datos desde PDFs.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5173
npm run test         # Vitest (350+ tests)
npm run lint         # ESLint + boundary checks
npm run build        # TypeScript check + Vite production build
npm run quality:gate # Full CI pipeline (lint + tests + build)
```

## Tech Stack

| Category | Technology |
|----------|------------|
| UI | React 18 + TypeScript 5.4 |
| State | Zustand 5 (slice pattern) |
| Styling | Tailwind CSS 3.4 |
| Validation | Zod 4 |
| Build | Vite 5 + PWA |
| Testing | Vitest 4 + Testing Library |
| Backend | Firebase (Auth + Firestore + Storage) |
| AI | Google Gemini API |
| PDF | pdfjs-dist |
| Deploy | Netlify (serverless functions) |

## Architecture Overview

```
src/
├── shared/          # Types, constants, utils, schemas (no dependencies)
├── domain/          # Pure business logic (depends only on shared/)
├── data/            # Ports (interfaces) + Adapters (implementations)
├── use-cases/       # Application logic orchestrating domain + data
├── services/        # Infrastructure (Firebase, Gemini, Storage, HTTP)
├── core/            # React integration (stores, hooks, providers, UI)
└── features/        # Feature modules (daily, reports, stats, etc.)
```

> **Dependency Rule:** Each layer may only import from layers above it in this list. This is enforced by `scripts/check-boundaries.mjs`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the detailed architecture guide.

## Key Features

- **Daily Patient Management** — Add, edit, filter, batch-move patients by date
- **PDF Import** — Automatic name/RUT/diagnosis extraction from Chilean medical PDFs
- **AI Integration** — Gemini-powered clinical analysis and data extraction
- **File Attachments** — Firebase Storage upload, preview, and management
- **Medical Reports** — Rich text editor with PDF/print export
- **Statistics** — Occupancy trends, bed rotation index, census data
- **Offline-First** — LocalStorage + IndexedDB shadow + Firebase sync
- **Security** — PIN lock, auto-lock, encrypted credentials

## Documentation Index

| Document | Purpose |
|----------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Clean Architecture layers, dependency rules, data flow |
| [src/README.md](src/README.md) | Source code map with every directory explained |
| [src/shared/README.md](src/shared/README.md) | Types, schemas, constants, utility functions |
| [src/domain/README.md](src/domain/README.md) | Pure business rules (patient, report, bookmarks) |
| [src/data/README.md](src/data/README.md) | Ports & Adapters pattern (hexagonal architecture) |
| [src/use-cases/README.md](src/use-cases/README.md) | Application-level orchestration logic |
| [src/services/README.md](src/services/README.md) | Infrastructure integrations (Firebase, Gemini, Storage) |
| [src/core/README.md](src/core/README.md) | React layer (Zustand store, hooks, providers, UI kit) |
| [src/features/README.md](src/features/README.md) | Feature modules (daily, reports, stats, AI, etc.) |

## Path Aliases

Configured in `tsconfig.json`:

```
@shared/*     → src/shared/*
@domain/*     → src/domain/*
@data/*       → src/data/*
@use-cases/*  → src/use-cases/*
@services/*   → src/services/*
@core/*       → src/core/*
@features/*   → src/features/*
```

## Testing

```bash
npm test                # Run all Vitest tests
npm run test:critical   # Critical path tests only
npm run test:coverage   # With V8 coverage
npm run test:node       # Node.js native test runner (integration/e2e)
npm run test:all        # Vitest + Node tests
```

## Maintaining Documentation

> **⚠️ IMPORTANT:** When modifying any layer, update the corresponding `README.md` in that directory. If you add a new feature module, create a `README.md` inside it.
