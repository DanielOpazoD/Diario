# data/ — Ports & Adapters (Hexagonal Architecture)

> Decouples application logic from infrastructure. Use-cases depend on **ports** (interfaces), not on Firebase/Storage directly.

## Structure

```
data/
├── ports/               # Interfaces (what the app needs)
│   ├── aiPort.ts            # AI analysis capabilities
│   ├── attachmentsPort.ts   # File upload/download/delete
│   ├── authPort.ts          # Authentication contract
│   ├── patientSyncPort.ts   # Patient synchronization
│   ├── reportDraftPort.ts   # Report draft persistence
│   └── storagePorts.ts      # LocalStorage + async storage
│
└── adapters/            # Implementations (how it's done)
    ├── geminiAdapter.ts         # ports.aiPort → geminiService
    ├── attachmentsAdapter.ts    # ports.attachments → firebaseStorageService
    ├── firebaseAuthAdapter.ts   # ports.auth → authService
    ├── firebasePatientSyncAdapter.ts  # ports.patientSync → firebaseService
    ├── reportDraftAdapter.ts    # ports.reportDraft → reportDraftService
    ├── localStorageAdapter.ts   # ports.storage → storage.ts
    ├── indexedDbAdapter.ts      # ports.storage → indexedDb.ts
    ├── storageAdapter.ts        # Unified storage facade
    └── storageProvider.ts       # Storage provider selection logic
```

## Why Ports & Adapters?

1. **Testability** — Use-cases can be tested with mock adapters
2. **Swappability** — Replace Firebase with Supabase by changing only adapters
3. **Boundary enforcement** — `use-cases/` imports `@data/ports`, never `@services/`

## Example

```typescript
// Port (interface)
export interface AttachmentsPort {
  uploadPatientFile: (file: File, patientId: string) => Promise<AttachedFile>;
  deletePatientFile: (patientId: string, fileName: string, fileId: string) => Promise<void>;
}

// Adapter (implementation)
import { uploadFileToFirebase, deleteFileFromFirebase } from '@services/firebaseStorageService';
export const attachmentsAdapter: AttachmentsPort = {
  uploadPatientFile: uploadFileToFirebase,
  deletePatientFile: deleteFileFromFirebase,
};
```
