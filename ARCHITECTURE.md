# Architecture

## Layers

1. **UI base**: `src/core/ui`, `src/core/components`
2. **Feature UI**: `src/features/*`
3. **Patient UI core**: `src/core/patient/*`
4. **State**: `src/core/stores/*`
5. **Use-cases**: `src/use-cases/*`
6. **Domain**: `src/domain/*`
7. **Data/Adapters**: `src/data/*`
8. **Services/Infra**: `src/services/*`
9. **Shared**: `src/shared/*`

## Dependency rules

- `features/*` -> `core/ui`, `core/components`, `core/patient`, `use-cases`, `shared`
- `core/patient/*` -> `core/ui`, `core/components`, `use-cases`, `shared`, `core/stores`
- `use-cases/*` -> `domain`, `data/ports`, `data/adapters`, `shared`
- `domain/*` -> `shared` only
- `data/adapters/*` -> `services/*` and `data/ports/*`
- `services/*` -> no imports from UI or domain

## Enforcement

Run:

- `npm run boundary:check`

This must pass before merge or deploy.

## Storage migrations

Local storage schema changes must be handled via `runStorageMigrations()` in `use-cases/storageMigrations`.

## Testing utilities

- `tests/setup.ts` establishes reusable mocks (e.g., `localStorage`, `matchMedia`, `URL.createObjectURL`) so unit suites can run in Node without mutating read-only globals. Prefer `Object.defineProperty` when overriding `globalThis` entries inside suites and keep mocks stateful via an encapsulated store.
- Domain parsing helpers (e.g., `patientTextExtraction.ts`) rely on grouped regex sets (`FIELD_PATTERNS`, fallback patterns, and line-based lookups) so tests can evolve without changing scattered literals. Add new patterns to the shared constants before sprouting new extraction logic.
