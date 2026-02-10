import type { PatientRecord } from '@shared/types';
import { normalizePatientRecord } from '@domain/patient/normalize';

const pickTimestamp = (record: PatientRecord): number => (
  record.updatedAt ?? record.createdAt ?? 0
);

const withUpdatedAt = (patient: PatientRecord, now: number): PatientRecord => ({
  ...normalizePatientRecord(patient),
  updatedAt: now,
});

const pickNewestRecord = (left: PatientRecord, right: PatientRecord): PatientRecord => (
  pickTimestamp(right) >= pickTimestamp(left) ? right : left
);

export const setPatientRecords = (records: PatientRecord[]): PatientRecord[] => {
  const orderedIds: string[] = [];
  const byId = new Map<string, PatientRecord>();

  records.forEach((record) => {
    const normalized = normalizePatientRecord(record);
    if (!normalized.id || normalized.id.trim().length === 0) return;

    if (!byId.has(normalized.id)) {
      orderedIds.push(normalized.id);
      byId.set(normalized.id, normalized);
      return;
    }

    const existing = byId.get(normalized.id);
    if (!existing) {
      byId.set(normalized.id, normalized);
      return;
    }

    byId.set(normalized.id, pickNewestRecord(existing, normalized));
  });

  return orderedIds
    .map((id) => byId.get(id))
    .filter((record): record is PatientRecord => Boolean(record));
};

export const addPatientRecord = (
  records: PatientRecord[],
  patient: PatientRecord,
  now: number = Date.now()
): PatientRecord[] => setPatientRecords([...records, withUpdatedAt(patient, now)]);

export const updatePatientRecord = (
  records: PatientRecord[],
  patient: PatientRecord,
  now: number = Date.now()
): PatientRecord[] => {
  const next = withUpdatedAt(patient, now);
  const hasExisting = records.some((record) => record.id === patient.id);

  if (!hasExisting) {
    return setPatientRecords([...records, next]);
  }

  return setPatientRecords(records.map((record) => (
    record.id === patient.id ? next : record
  )));
};

export const deletePatientRecord = (records: PatientRecord[], id: string): PatientRecord[] => (
  records.filter((record) => record.id !== id)
);
