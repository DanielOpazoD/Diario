import { PatientCreateInput, PatientRecord, PatientUpdateInput } from '@shared/types';
import { normalizePatientName, normalizePatientTypeLabel } from './rules';

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getTodayYMD = (now = new Date()) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (value: unknown, fallback: string) =>
  typeof value === 'string' && YMD_PATTERN.test(value.trim()) ? value.trim() : fallback;

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const buildNewPatient = (data: PatientCreateInput): PatientRecord => {
  const maybeId = (data as PatientRecord).id;
  const maybeCreatedAt = (data as PatientRecord).createdAt;
  const maybeUpdatedAt = (data as PatientRecord).updatedAt;
  const createdAt = typeof maybeCreatedAt === 'number' ? maybeCreatedAt : Date.now();
  const updatedAt = typeof maybeUpdatedAt === 'number' ? maybeUpdatedAt : createdAt;
  const today = getTodayYMD();
  return {
    ...data,
    id: maybeId || crypto.randomUUID(),
    createdAt,
    updatedAt,
    date: normalizeDate(data.date, today),
    name: normalizePatientName(data.name),
    rut: normalizeText(data.rut),
    diagnosis: normalizeText(data.diagnosis),
    clinicalNote: normalizeText(data.clinicalNote),
    type: normalizePatientTypeLabel(normalizeText(data.type)),
    typeId: normalizeText(data.typeId),
    pendingTasks: data.pendingTasks ?? [],
    attachedFiles: data.attachedFiles ?? [],
  };
};

export const buildUpdatedPatient = (existing: PatientRecord, data: PatientUpdateInput): PatientRecord => ({
  ...existing,
  ...data,
  id: existing.id,
  createdAt: existing.createdAt,
  updatedAt: typeof (data as Partial<PatientRecord>).updatedAt === 'number'
    ? (data as Partial<PatientRecord>).updatedAt
    : Date.now(),
  date: normalizeDate(data.date, normalizeDate(existing.date, getTodayYMD())),
  name: normalizePatientName(data.name),
  rut: normalizeText(data.rut),
  diagnosis: normalizeText(data.diagnosis),
  clinicalNote: normalizeText(data.clinicalNote),
  type: normalizePatientTypeLabel(normalizeText(data.type) || existing.type),
  typeId: normalizeText(data.typeId) || existing.typeId,
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
