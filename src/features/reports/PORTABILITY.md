# Reports Module Portability

This feature can now run with an injected host adapter.

## Entry points

- `MedicalReportView`:
  default wrapper for Medidiario (uses Zustand + Router host adapter).
- `MedicalReportViewContent`:
  portable view. Use this in external apps with a custom `host`.

## Host contract

Import from `src/features/reports/index.ts`:

- `ReportHostContext`
- `ReportHostState`
- `ReportHostActions`
- `ReportDataPort`
- `ReportSessionPort`
- `useLinkedJsonImport`
- `useReportEditorState`
- `useReportPersistenceActions`
- `useReportTopbarContext`

### Required host fields

- `state.user`
- `state.records`
- `state.patientTypes`
- `actions.addPatient`
- `actions.updatePatient`
- `actions.addToast`
- `data.savePatientRecord`
- `data.uploadPatientFile`
- `data.updatePatientFileById`
- `data.downloadPatientFileBlob`
- `data.downloadPatientFileBlobById`
- `session.getLinkedJsonRaw`
- `session.setLinkedJsonRaw`
- `session.getTopbarContextRaw`
- `session.setTopbarContextRaw`
- `session.clearTopbarContext`
- `locationSearch`
- `openExternal`
- `emitReportContextChanged`

## Minimal integration example

```tsx
import { MedicalReportViewContent, type ReportHostContext } from '@features/reports';

const host: ReportHostContext = {
  state: { user, records, patientTypes },
  actions: {
    addPatient,
    updatePatient,
    addToast: (type, message) => notify(type, message),
  },
  data: {
    savePatientRecord,
    uploadPatientFile,
    updatePatientFileById,
    downloadPatientFileBlob,
    downloadPatientFileBlobById,
  },
  session: {
    getLinkedJsonRaw: () => sessionStorage.getItem('my_report_linked_json'),
    setLinkedJsonRaw: (value) => sessionStorage.setItem('my_report_linked_json', value),
    getTopbarContextRaw: () => sessionStorage.getItem('my_report_topbar_ctx'),
    setTopbarContextRaw: (value) => sessionStorage.setItem('my_report_topbar_ctx', value),
    clearTopbarContext: () => sessionStorage.removeItem('my_report_topbar_ctx'),
  },
  locationSearch: window.location.search,
  openExternal: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
  emitReportContextChanged: () => window.dispatchEvent(new CustomEvent('medidiario:report-context')),
};

export const ReportsPage = () => <MedicalReportViewContent host={host} />;
```

## Current modular blocks

- `hooks/useReportEditorState.ts`: sheet editing state, structural actions, advanced toolbar commands.
- `hooks/useReportPersistenceActions.ts`: create/update persistence flow (PDF+JSON+Firebase).
- `hooks/useLinkedJsonImport.ts`: linked JSON resolution/import lifecycle.
- `host/reportHost.ts`: host adapter boundary for state/actions/data/session.
