# features/ — Vertical Feature Modules

> Each feature is a self-contained vertical slice. Features can import from `@core/*`, `@shared/*`, and `@use-cases/*` but should not import from other features.

## Modules

### daily/
**Main patient list view.** The primary screen of the application.

| File | Purpose |
|------|---------|
| `DailyView.tsx` | Patient grid with filter bar, batch operations, and PDF import |
| `DateNavigator.tsx` | Date picker with keyboard navigation |
| `FilterBar.tsx` | Filter by patient type and search |
| `VirtualizedPatientList.tsx` | Virtualized patient list (TanStack Virtual) |
| `TaskDashboard.tsx` | Pending tasks overview across patients |
| `AppViews.tsx` | View router (switches between modules) |
| `AppModals.tsx` | Modal orchestration |
| `AppMenuModal.tsx` | Main navigation menu |
| `components/PdfImportEntry.tsx` | PDF import button/dropzone |
| `components/QuickNotesPanel.tsx` | Quick notes sidebar |

---

### reports/
**Medical report editor** with rich text, PDF export, and JSON persistence.

Self-contained module following a "host pattern" — `reportHost.ts` defines the contract for data the reports feature needs, allowing it to be decoupled from the main app state.

Key subdirectories:
- `services/` — Report persistence, PDF generation, print formatting
- `hooks/` — useMedicalReportController, useReportPersistenceActions
- `components/` — ReportSheet, ReportToolbar, ReportHeader

---

### stats/
**Clinical statistics dashboard.** Occupancy trends, bed rotation index, census data with Recharts visualizations.

---

### files/
**File attachment manager.** Upload, preview, tag, categorize, and star patient files. Integrates with Firebase Storage.

Key components:
- `FileManagerView.tsx` — Main file browser
- `FileGrid.tsx` / `FileList.tsx` — Display modes
- `FilePreviewModal.tsx` — Image/PDF preview
- `FileDropzone.tsx` — Drag-and-drop upload

---

### ai/
**AI assistant.** Uses Gemini API for clinical analysis, patient data extraction from images, and structured diagnosis generation.

---

### history/
**Historical patient browser.** Paginated view of past patient records with search and filtering.

---

### bookmarks/
**Quick-access URL manager.** Categorized bookmarks with drag-and-drop reordering and favorite marking.

---

### settings/
**App configuration.** Theme toggle, patient type management, security PIN, data backup/restore, and user profile.

---

### search/
**Cross-date patient search.** Find patients across all dates by name, RUT, or diagnosis.

## Adding a New Feature

1. Create `src/features/your-feature/` directory
2. Add a `README.md` describing the feature
3. Create the main view component (e.g., `YourFeatureView.tsx`)
4. Register the route in `src/shared/routes.ts`
5. Add the view to `src/features/daily/AppViews.tsx`
6. Add navigation item to `src/core/components/` navbar config
7. Only import from `@core/*`, `@shared/*`, `@use-cases/*`
