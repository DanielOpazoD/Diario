# use-cases/ — Application Logic

> Orchestrates domain rules and data access. This is where the "what the app does" lives, without knowing "how" (React, Firebase, etc.).

## Structure

```
use-cases/
├── patient/                    # Patient-specific operations
│   ├── createImportedPatient.ts    # Create patient from PDF extraction
│   ├── createPatient.ts            # Standard patient creation
│   ├── updatePatient.ts            # Patient update with sanitization
│   ├── deletePatient.ts            # Patient deletion
│   ├── movePatient.ts              # Move patient to different date
│   ├── copyPatient.ts              # Copy patient to another date
│   ├── syncState.ts                # Compute sync signature for dirty detection
│   ├── mergeExtractedUseCase.ts    # Merge AI-extracted data into record
│   └── repairAttachments.ts        # Fix broken file references
│
├── patientSync.ts              # Sync patients to Firebase with retry (exponential backoff)
├── patientSyncMerge.ts         # Conflict resolution (last-write-wins + field merge)
│
├── storage.ts                  # Save/load from LocalStorage
├── storageAsync.ts             # Async storage operations
├── storageIndexedDb.ts         # IndexedDB read/write
├── storageShadow.ts            # Shadow write to IndexedDB for redundancy
├── storageMigrations.ts        # Data migration between schema versions
│
├── attachments.ts              # File upload/download facade (via adapter)
├── bookmarks.ts                # Bookmark CRUD operations
├── tasks.ts                    # General task operations
├── auth.ts                     # Login/logout flow
├── logger.ts                   # Event logging facade
├── ai.ts                       # AI analysis facade
├── reportPatient.ts            # Report-specific patient operations
└── reports.ts                  # Report generation operations
```

## Key Patterns

### Dirty Detection (`patient/syncState.ts`)
Each patient has a "sync signature" — a hash of its mutable fields. When the signature changes compared to the last synced version, the patient is marked as "dirty" and queued for Firebase sync.

### Conflict Resolution (`patientSyncMerge.ts`)
When both local and remote versions exist:
1. Compare `updatedAt` timestamps
2. More recent version wins
3. Merged result preserves the richer data (e.g., if remote has files local doesn't)

### Storage Redundancy
```
LocalStorage (primary, synchronous)
  └─→ IndexedDB (shadow, async, activated by STORAGE_SHADOW_WRITE flag)
       └─→ Firebase Firestore (cloud, async, incremental sync)
```
