import { PatientFormData, PatientRecord } from '@shared/types';

export const normalizePatientName = (name: string): string => {
  if (!name) return '';
  return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
};

export const buildNewPatient = (data: PatientFormData): PatientRecord => ({
  ...data,
  id: crypto.randomUUID(),
  createdAt: Date.now(),
  name: normalizePatientName(data.name),
  pendingTasks: data.pendingTasks ?? [],
  attachedFiles: data.attachedFiles ?? [],
});

export const buildUpdatedPatient = (existing: PatientRecord, data: PatientFormData): PatientRecord => ({
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
