# core/ — React Integration Layer

> Bridges the pure application logic (use-cases) with the React UI. Contains Zustand stores, React hooks, layout components, and the shared UI kit.

## Structure

```
core/
├── stores/              # Zustand state management
│   ├── useAppStore.ts       # Main store (8 slices composed)
│   ├── initialState.ts      # Hydrate from LocalStorage on boot
│   └── slices/
│       ├── patientSlice.ts      # Patient records CRUD
│       ├── taskSlice.ts         # General tasks
│       ├── userSlice.ts         # Auth user + theme
│       ├── uiSlice.ts           # Toasts + sync status
│       ├── securitySlice.ts     # PIN lock settings
│       ├── preferencesSlice.ts  # UI preferences
│       ├── patientTypesSlice.ts # Configurable patient categories
│       └── bookmarkSlice.ts     # Bookmarks
│
├── app/                 # Application bootstrap
│   ├── persistence.ts       # Store → LocalStorage/IndexedDB/Firebase subscription
│   ├── providers/           # AppProviders (wraps all context providers)
│   └── shell/               # AppShell (layout + routing)
│
├── hooks/               # App-level React hooks
│   ├── useFirebaseSync.ts   # Real-time Firestore listener
│   ├── useAppActions.ts     # Convenience actions derived from store
│   ├── usePatientCrud.ts    # Patient CRUD with toast feedback
│   ├── useDailyRecordActions.ts  # Daily record management
│   └── useKeyboardShortcuts.ts   # Global keyboard shortcuts
│
├── patient/             # Patient-specific UI logic
│   ├── hooks/               # usePdfPatientImport, usePatientDataExtraction
│   ├── components/          # PatientModal, ExecutivePatientRow, InlineEditor
│   └── index.ts             # Public API barrel
│
├── ui/                  # Shared design system
│   ├── Button.tsx           # Primary button component
│   ├── Modal.tsx            # Generic modal
│   ├── ConfirmationModal.tsx  # Yes/No dialog
│   ├── Toast.tsx            # Auto-dismiss notifications (1.5s)
│   ├── LoadingSkeletons.tsx # Content placeholders
│   └── index.ts             # Public API barrel
│
├── layouts/             # Page layout shells
├── components/          # Navbar, DateBar, shared UI
├── context/             # React contexts (DailyRecordContext)
├── config/              # Core configuration
└── providers/           # Global provider composition
```

## State Management Pattern

All state lives in a single Zustand store composed of **8 slices**:

```typescript
type AppStore = PatientSlice & TaskSlice & UserSlice
  & PatientTypesSlice & SecuritySlice & PreferencesSlice
  & BookmarksSlice & UiSlice;
```

State is accessed via `useAppStore` with selector functions:
```typescript
const records = useAppStore(state => state.records);
const addToast = useAppStore(state => state.addToast);
```

For multiple selectors, use `useShallow` to prevent unnecessary re-renders:
```typescript
const { toasts, removeToast } = useAppStore(useShallow(state => ({
  toasts: state.toasts,
  removeToast: state.removeToast,
})));
```

## Persistence Flow

`persistence.ts` subscribes to the Zustand store and:
1. **Debounces** changes (500ms)
2. **Saves** to LocalStorage (synchronous)
3. **Shadow-writes** to IndexedDB (async backup)
4. **Syncs** only dirty patients to Firebase (incremental, with retry + cooldown)
