# services/ — Infrastructure Layer

> Concrete implementations of external integrations. **No other layer imports `@services/` directly** except `data/adapters/`.

## Files

| File | Purpose |
|------|---------|
| `firebaseConfig.ts` | Firebase app initialization, environment detection |
| `firebaseService.ts` | Re-exports Firebase Firestore operations |
| `firebaseStorageService.ts` | File upload/download/list/delete in Firebase Storage |
| `authService.ts` | Google OAuth (popup + redirect), user session management |
| `geminiService.ts` | Google Gemini AI API client (text + multimodal) |
| `aiAnalysisService.ts` | AI-powered clinical analysis (diagnosis, task extraction) |
| `storage.ts` | LocalStorage operations with error handling |
| `indexedDb.ts` | IndexedDB CRUD (fallback/shadow storage) |
| `logger.ts` | Structured logging with session tracking |
| `httpClient.ts` | Generic fetch wrapper with timeout/retry |
| `pdfText.ts` | PDF text extraction using pdfjs-dist |
| `reportDraftService.ts` | Report draft auto-save to LocalStorage |
| `reportService.ts` | Report JSON/PDF export service |

## Subdirectories

### firebase/
Firebase SDK module split for tree-shaking:
- `auth.ts` — `getAuth()` singleton
- `firestore.ts` — `getFirestore()` singleton
- `storage.ts` — `getStorage()` singleton
- `firestoreSync.ts` — Firestore real-time listener + snapshot processing

## Key Implementation Details

### Firebase Storage Naming (`firebaseStorageService.ts`)
Files are stored as `{uuid}_{originalFilename}` to preserve the original name:
```
users/{uid}/patients/{patientId}/{fileId}_{originalName.pdf}
```

When listing files, `resolveStoredFileName()` parses this pattern to recover the display name.

### PDF Text Extraction (`pdfText.ts`)
Uses pdfjs-dist's `getTextContent()` with Y-coordinate line detection to reconstruct text layout from PDF rendering data. This handles multi-column PDFs common in Chilean medical institutions.

### Structured Logging (`logger.ts`)
All log entries include:
- Timestamp, level (info/warn/error)
- Source component name
- Session ID (for tracing across page loads)
- Optional structured details object
