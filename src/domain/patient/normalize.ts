import type { PatientRecord } from '@shared/types';
import { PatientRecordSchema } from '@shared/schemas';

export const normalizePatientRecord = (record: PatientRecord): PatientRecord => {
  const result = PatientRecordSchema.safeParse(record);
  if (result.success) {
    return result.data as PatientRecord;
  }

  // Fallback to manual normalization for critical fields if validation fails
  // to avoid record corruption in legacy data during migration.
  return {
    ...record,
    driveFolderId: record.driveFolderId ?? null,
    attachedFiles: Array.isArray(record.attachedFiles) ? record.attachedFiles : [],
    pendingTasks: Array.isArray(record.pendingTasks) ? record.pendingTasks : [],
    diagnosis: record.diagnosis ?? '',
    clinicalNote: record.clinicalNote ?? '',
  };
};

export const normalizePatientRecords = (records: PatientRecord[]): PatientRecord[] =>
  records.map(normalizePatientRecord);
