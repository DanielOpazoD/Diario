import type { PatientRecord } from '@shared/types';

const toNumber = (value?: number) => (Number.isFinite(value) ? (value as number) : 0);

export type PatientVersionVector = {
  updatedAt: number;
  syncUpdatedAt: number;
  createdAt: number;
};

export const getPatientVersionVector = (record: PatientRecord): PatientVersionVector => ({
  updatedAt: toNumber(record.updatedAt),
  syncUpdatedAt: toNumber(record.syncMeta?.updatedAt),
  createdAt: toNumber(record.createdAt),
});

const normalizeTasks = (record: PatientRecord) =>
  (record.pendingTasks ?? []).map((task) => ({
    id: task.id,
    text: task.text,
    isCompleted: task.isCompleted,
    createdAt: toNumber(task.createdAt),
    completedAt: toNumber(task.completedAt),
    completionNote: task.completionNote ?? '',
  }));

const normalizeFiles = (record: PatientRecord) =>
  (record.attachedFiles ?? []).map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    uploadedAt: toNumber(file.uploadedAt),
    driveUrl: file.driveUrl,
    customTitle: file.customTitle ?? '',
    customTypeLabel: file.customTypeLabel ?? '',
    noteDate: file.noteDate ?? '',
    category: file.category ?? '',
    isStarred: Boolean(file.isStarred),
    description: file.description ?? '',
    tags: file.tags ?? [],
  }));

export const getPatientDataSignature = (record: PatientRecord): string => JSON.stringify({
  id: record.id,
  name: record.name,
  rut: record.rut,
  birthDate: record.birthDate ?? '',
  gender: record.gender ?? '',
  date: record.date,
  type: record.type,
  typeId: record.typeId ?? '',
  entryTime: record.entryTime ?? '',
  exitTime: record.exitTime ?? '',
  diagnosis: record.diagnosis,
  clinicalNote: record.clinicalNote,
  driveFolderId: record.driveFolderId ?? null,
  pendingTasks: normalizeTasks(record),
  attachedFiles: normalizeFiles(record),
});

export const getPatientSyncStateSignature = (record: PatientRecord): string => JSON.stringify({
  version: getPatientVersionVector(record),
  data: getPatientDataSignature(record),
});

export const arePatientRecordsEquivalent = (left: PatientRecord, right: PatientRecord): boolean =>
  getPatientSyncStateSignature(left) === getPatientSyncStateSignature(right);
