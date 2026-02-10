import { describe, expect, it } from 'vitest';
import type { PatientRecord } from '@shared/types';
import {
  arePatientRecordsEquivalent,
  getPatientDataSignature,
  getPatientSyncStateSignature,
  getPatientVersionVector,
} from '@use-cases/patient/syncState';

const makePatient = (id: string): PatientRecord => ({
  id,
  name: 'Paciente',
  rut: '1-9',
  date: '2026-02-10',
  type: 'Hospitalizado',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
  attachedFiles: [],
  updatedAt: 10,
  createdAt: 5,
  syncMeta: { updatedAt: 10 },
});

describe('patient sync state use-cases', () => {
  it('builds version vector from sync fields', () => {
    expect(getPatientVersionVector(makePatient('p1'))).toEqual({
      updatedAt: 10,
      syncUpdatedAt: 10,
      createdAt: 5,
    });
  });

  it('changes signatures when payload changes', () => {
    const left = makePatient('p1');
    const right = { ...makePatient('p1'), diagnosis: 'dx' };
    expect(getPatientDataSignature(left)).not.toBe(getPatientDataSignature(right));
    expect(getPatientSyncStateSignature(left)).not.toBe(getPatientSyncStateSignature(right));
  });

  it('detects equivalent records correctly', () => {
    const left = makePatient('p1');
    const right = makePatient('p1');
    const changed = { ...makePatient('p1'), updatedAt: 11 };
    expect(arePatientRecordsEquivalent(left, right)).toBe(true);
    expect(arePatientRecordsEquivalent(left, changed)).toBe(false);
  });
});
