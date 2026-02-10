# Medidiario Architecture Map

This document defines the target module boundaries to keep the codebase maintainable, portable, and scalable.

## Layer map

- `src/domain`
  - Pure business rules and entities.
  - No framework/store/network dependencies.
- `src/use-cases`
  - Application workflows and orchestration of domain + data ports.
  - No UI framework dependencies.
- `src/data`
  - Concrete adapters and ports for external systems (firebase, storage, ai).
  - Adapter details are hidden behind use-cases.
- `src/core`
  - App shell, global store wiring, cross-feature infrastructure.
  - Should not contain feature business rules.
- `src/features`
  - Feature UI modules and local view state.
  - Should call use-cases, not data adapters.
- `src/shared`
  - Cross-cutting utility modules, constants, schemas, basic types.

## Dependency direction

Allowed direction:

`features/core -> use-cases -> domain`

`use-cases -> data/ports|adapters -> services`

`core -> use-cases + shared + domain`

Forbidden direction (examples):

- `domain -> use-cases/core/features/services`
- `use-cases -> core/features/stores`
- `features -> data/adapters`
- `data/adapters -> features/core`

## Module contracts

- `features/*`
  - Should expose UI components/hooks only.
  - Business logic should be extracted to `use-cases` or `domain`.
- `use-cases/*`
  - Should expose pure functions/services that can be unit-tested without React.
  - Prefer typed inputs/outputs (no implicit state reads).
- `data/adapters/*`
  - Should implement ports and wrap external SDKs.
  - No business decisions here.

## Governance

- Boundary checks are enforced by `npm run boundary:check`.
- CI gate uses `npm run quality:gate`.
- New modules should include:
  - clear ownership layer,
  - unit tests for business logic,
  - no boundary violations.
