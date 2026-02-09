import type { PatientRecord } from '@shared/types';

export const normalizePatientRecord = (record: PatientRecord): PatientRecord => ({
  ...record,
  driveFolderId: record.driveFolderId ?? null,
  attachedFiles: Array.isArray(record.attachedFiles) ? record.attachedFiles : [],
  pendingTasks: Array.isArray(record.pendingTasks) ? record.pendingTasks : [],
  diagnosis: record.diagnosis ?? '',
  clinicalNote: record.clinicalNote ?? '',
});

export const normalizePatientRecords = (records: PatientRecord[]): PatientRecord[] =>
  records.map(normalizePatientRecord);
