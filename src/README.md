# src/ — Source Code Map

## Directory Structure

```
src/
├── App.tsx              # Root component (Firebase sync + persistence init)
├── index.tsx            # React entry point (QueryClient, Router, PWA)
│
├── shared/              # Foundation layer (zero app dependencies)
│   ├── types.ts         # All TypeScript interfaces (PatientRecord, User, etc.)
│   ├── schemas/         # Zod validation schemas
│   ├── constants/       # Storage keys, defaults, IndexedDB config
│   ├── config/          # Feature flags and sync policies
│   ├── hooks/           # Reusable React hooks (usePatientFilter, etc.)
│   ├── utils/           # Pure utility functions (date, sanitization, theme)
│   └── routes.ts        # Route definitions
│
├── domain/              # Pure business logic (no React, no Firebase)
│   ├── patient/         # Patient validation, sanitization, text extraction
│   ├── report/          # Report domain rules (filtering, formatting)
│   ├── bookmarks.ts     # Bookmark CRUD logic
│   └── tasks.ts         # Task creation logic
│
├── data/                # Hexagonal architecture boundary
│   ├── ports/           # Interfaces (what the app needs)
│   └── adapters/        # Implementations (how it's done)
│
├── use-cases/           # Application logic (orchestrates domain + data)
│   ├── patient/         # Patient CRUD, sync, merge, extraction
│   ├── patientSync.ts   # Firebase sync with retry
│   ├── patientSyncMerge.ts  # Conflict resolution
│   ├── storage.ts       # LocalStorage persistence
│   ├── storageAsync.ts  # Async storage operations
│   ├── storageIndexedDb.ts  # IndexedDB operations
│   ├── storageShadow.ts # Shadow write for redundancy
│   ├── attachments.ts   # File upload/download
│   ├── bookmarks.ts     # Bookmark operations
│   ├── tasks.ts         # Task operations
│   └── auth.ts          # Authentication flow
│
├── services/            # Infrastructure implementations
│   ├── firebase/        # Firebase SDK initialization
│   ├── firebaseConfig.ts     # Config + environment detection
│   ├── firebaseStorageService.ts  # File upload/download/list
│   ├── authService.ts        # Google Auth flow
│   ├── geminiService.ts      # Gemini AI API client
│   ├── aiAnalysisService.ts  # AI-powered clinical analysis
│   ├── storage.ts            # LocalStorage service
│   ├── indexedDb.ts          # IndexedDB service
│   ├── logger.ts             # Structured logging
│   ├── httpClient.ts         # Generic HTTP client
│   └── pdfText.ts            # PDF text extraction (pdfjs-dist)
│
├── core/                # React-specific integration
│   ├── stores/          # Zustand store + 8 slices
│   ├── hooks/           # App-level hooks (useFirebaseSync)
│   ├── app/             # Persistence, providers, shell
│   ├── patient/         # Patient-specific hooks + components
│   ├── ui/              # Design system (Button, Modal, Toast, etc.)
│   ├── layouts/         # Page layout components
│   ├── components/      # Shared components (Navbar, etc.)
│   ├── context/         # React contexts
│   ├── config/          # Core configuration
│   └── providers/       # Global providers wrapper
│
└── features/            # Vertical feature slices
    ├── daily/           # Main daily patient view
    ├── reports/         # Medical report editor
    ├── stats/           # Clinical statistics
    ├── files/           # File attachment manager
    ├── ai/              # AI assistant
    ├── history/         # Historical records
    ├── bookmarks/       # URL bookmarks
    ├── settings/        # App settings & security
    └── search/          # Cross-date search
```

## Entry Points

1. **`index.tsx`** — Creates React root, wraps in `QueryClientProvider` and router
2. **`App.tsx`** — Initializes `useFirebaseSync()` and `initPersistence()`, renders `AppProviders > AppShell`
