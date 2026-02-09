# Coding Standards

## Core principles

- UI is dumb. Business logic lives in `use-cases` or `domain`.
- `domain` never imports UI, services, or adapters.
- Side-effects and IO live in adapters/services, never in UI.
- Reuse domain/use-cases for sanitization and validation.
- Never log PHI/PII; use `logEvent` which redacts sensitive fields.

## Do

- Keep hooks focused on UI state and orchestration.
- Add unit tests for domain/use-cases.
- Use Vitest for `*.test.ts/tsx` and Node's test runner for `*.test.js`.
- Prefer pure functions for business rules.

## Don't

- Import `@services/*` in `core/*` or `features/*`.
- Scatter validation logic across components.
- Store PHI/PII in logs.
