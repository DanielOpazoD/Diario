# Architecture Guide

## Clean Architecture

Medidiario uses a strict layered architecture inspired by Clean Architecture and Hexagonal Architecture (Ports & Adapters). The fundamental rule is:

> **Inner layers never depend on outer layers.**

```
┌─────────────────────────────────────────────────────────┐
│  features/         UI feature modules (React components)│
│  core/             React integration (stores, hooks, UI)│
├─────────────────────────────────────────────────────────┤
│  use-cases/        Application logic (orchestration)    │
├─────────────────────────────────────────────────────────┤
│  data/             Ports (interfaces) + Adapters (impl) │
├─────────────────────────────────────────────────────────┤
│  services/         Infrastructure (Firebase, HTTP, etc.)│
├─────────────────────────────────────────────────────────┤
│  domain/           Pure business logic (no deps)        │
│  shared/           Types, constants, utilities          │
└─────────────────────────────────────────────────────────┘
```

## Dependency Rules

These rules are **enforced at CI** by `scripts/check-boundaries.mjs`:

| Layer | Can Import | Cannot Import |
|-------|-----------|---------------|
| `shared/` | Nothing | — |
| `domain/` | `@shared/*` | `@core/*`, `@features/*`, `@services/*` |
| `data/adapters` | `@services/*`, `@shared/*` | `@core/*`, `@features/*` |
| `use-cases/` | `@domain/*`, `@data/*`, `@shared/*` | `@core/*`, `@features/*` |
| `core/stores` | `@shared/*`, `@use-cases/*` | `@features/*`, `@services/*` |
| `core/`, `features/` | `@use-cases/*`, `@shared/*`, `@core/*` | `@services/*` (direct) |

## Data Flow

### Write Path (User Action → Firebase)
```
User clicks "Save" in DailyView
  → Zustand store.addPatient(record)
    → persistence.ts detects change (subscription)
      → saveRecordsToLocal(records)          // LocalStorage
      → shadowWriteToIndexedDb(records)       // IndexedDB backup
      → syncPatientsWithRetry(dirtyPatients)  // Firebase Firestore
```

### Read Path (Firebase → UI)
```
Firebase onSnapshot listener fires
  → useFirebaseSync hook receives doc changes
    → mergeIncomingPatients (conflict resolution)
      → Zustand store.setRecords(merged)
        → React re-renders subscribed components
```

### PDF Import Path
```
User selects PDF file
  → extractTextFromPdf (pdfjs-dist with Y-coordinate line detection)
    → extractPatientDataFromText (regex + table-format + blocklist)
      → isLikelyName filter (accent-normalized, punctuation-stripped)
      → extractSection (accent-normalized label matching)
    → createImportedPatientRecord
      → uploadFileToFirebase (preserves original filename)
        → store.addPatient + store.updatePatient with attachedFile
```

## State Management

Zustand store with **8 slices**:

| Slice | Purpose |
|-------|---------|
| `patientSlice` | Patient records CRUD |
| `taskSlice` | General tasks management |
| `userSlice` | Auth user info + theme |
| `patientTypesSlice` | Configurable patient categories |
| `securitySlice` | PIN lock settings |
| `preferencesSlice` | UI preferences (compact stats, etc.) |
| `bookmarkSlice` | Quick-access URL bookmarks |
| `uiSlice` | Toast notifications + sync status |

## Persistence Strategy

```
                ┌─────────────┐
                │ Zustand Store│
                └──────┬──────┘
                       │ subscribe (500ms debounce)
              ┌────────┴────────┐
              ▼                 ▼
    ┌─────────────────┐  ┌──────────────┐
    │  LocalStorage    │  │  IndexedDB   │
    │  (primary)       │  │  (shadow)    │
    └────────┬────────┘  └──────────────┘
             │
             ▼ only dirty patients
    ┌─────────────────┐
    │  Firebase        │
    │  Firestore       │
    └─────────────────┘
```

**Conflict Resolution:** When incoming Firebase data conflicts with local changes, the record with the most recent `updatedAt` timestamp wins. See `patientSyncMerge.ts`.

## Feature Modules

Each feature is a self-contained vertical slice under `src/features/`:

| Module | Purpose |
|--------|---------|
| `daily/` | Main patient list view with date navigation |
| `reports/` | Medical report editor, PDF/JSON export |
| `stats/` | Clinical statistics and occupancy charts |
| `files/` | File attachment manager and viewer |
| `ai/` | AI chat assistant and file analysis |
| `history/` | Historical patient record browser |
| `bookmarks/` | Quick-access URL manager |
| `settings/` | App configuration and security |
| `search/` | Cross-date patient search |

## Testing Strategy

- **Unit Tests** (Vitest): 94 test files covering domain, use-cases, slices, hooks, and components
- **Boundary Checks** (Node script): Prevent architectural violations at CI
- **Coverage Gate**: Integrated V8 coverage with `npm run test:coverage`
- **Quality Gate**: `npm run quality:gate` runs boundary check → lint → critical tests → coverage → node tests → build
