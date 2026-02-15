# shared/ — Foundation Layer

> Zero application dependencies. Used by every other layer.

## types.ts — Core Interfaces

| Type | Purpose |
|------|---------|
| `PatientRecord` | Central entity with name, RUT, diagnosis, tasks, files |
| `PatientTypeConfig` | Configurable patient categories (Hospitalizado, Policlínico, etc.) |
| `PendingTask` | Per-patient task with completion tracking |
| `GeneralTask` | Global task with priority levels |
| `AttachedFile` | File attachment metadata (Firebase Storage) |
| `User` | Authenticated user (name, email, avatar) |
| `ExtractedPatientData` | Data extracted from PDF text |
| `AIAnalysisResult` | Gemini AI structured output |
| `ToastMessage` | UI notification type |
| `Bookmark` / `BookmarkCategory` | Quick-access URL system |
| `SecuritySettings` | PIN hash, salt, auto-lock config |
| `ViewMode` | App navigation states |

## Subdirectories

### constants/
- `storageKeys.ts` — All LocalStorage key names (centralized, avoids magic strings)
- `storageDefaults.ts` — Default values for preferences
- `indexedDb.ts` — Database name and store config
- `sessionKeys.ts` — Session-scoped storage keys
- `appEvents.ts` — Custom event names

### config/
- `storageConfig.ts` — Feature flag: `STORAGE_SHADOW_WRITE` (IndexedDB redundancy)
- `syncPolicy.ts` — Sync retry limits, cooldown timers, debounce

### schemas/
- Zod schemas for runtime validation of patient data and imports

### hooks/
| Hook | Purpose |
|------|---------|
| `usePatientFilter` | Filter patient list by type, search, status |
| `usePatientSearch` | Fuzzy search across patient records |
| `usePatientHistory` | Navigate patient history across dates |
| `useDailyMetrics` | Calculate daily stats (count, pending tasks) |
| `useDailyRange` | Date range navigation logic |
| `useBatchOperations` | Multi-select move/copy patients |
| `useModalManager` | Generic modal open/close state |
| `useDebouncedCallback` | Debounce utility hook |
| `usePrefetch` | Preload data for upcoming dates |
| `useViewLifecycle` | Track component mount/unmount |

### utils/
Pure functions for date formatting, sanitization, theme toggling, privacy anonymization, safe storage access, and JSON serialization.
