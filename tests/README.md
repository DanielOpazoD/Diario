# Tests

This repo uses two test runners:

- Vitest for `*.test.ts` / `*.test.tsx` (UI + unit/integration)
- Node's built-in test runner for `*.test.js` (node-only helpers and module loading)
  - Node tests resolve legacy paths via `tests/utils/legacyPaths.js`.

Run:

```
npm run test
npm run test:node
npm run test:all
```
