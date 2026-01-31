import { PatientCreateInput, PatientRecord, PatientUpdateInput } from '@shared/types';
import { normalizePatientName } from './rules';

export const buildNewPatient = (data: PatientCreateInput): PatientRecord => {
  const maybeId = (data as PatientRecord).id;
  const maybeCreatedAt = (data as PatientRecord).createdAt;
  return {
    ...data,
    id: maybeId || crypto.randomUUID(),
    createdAt: typeof maybeCreatedAt === 'number' ? maybeCreatedAt : Date.now(),
    name: normalizePatientName(data.name),
    pendingTasks: data.pendingTasks ?? [],
    attachedFiles: data.attachedFiles ?? [],
  };
};

export const buildUpdatedPatient = (existing: PatientRecord, data: PatientUpdateInput): PatientRecord => ({
  ...existing,
  ...data,
  id: existing.id,
  createdAt: existing.createdAt,
  name: normalizePatientName(data.name),
  pendingTasks: data.pendingTasks ?? [],
  attachedFiles: data.attachedFiles ?? [],
});

export const clonePatientForDate = (
  patient: PatientRecord,
  targetDate: string,
  timestamp: number,
  index: number
): PatientRecord => ({
  ...patient,
  id: crypto.randomUUID(),
  date: targetDate,
  createdAt: timestamp + index,
  updatedAt: timestamp + index,
  pendingTasks: (patient.pendingTasks ?? []).map((task) => ({ ...task, id: crypto.randomUUID() })),
  attachedFiles: (patient.attachedFiles ?? []).map((file) => ({ ...file, id: crypto.randomUUID() })),
});
