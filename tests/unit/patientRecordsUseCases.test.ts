import { describe, expect, it } from 'vitest';
import type { PatientRecord } from '@shared/types';
import {
  addPatientRecord,
  deletePatientRecord,
  setPatientRecords,
  updatePatientRecord,
} from '@use-cases/patient/records';

const makePatient = (id: string, name: string): PatientRecord => ({
  id,
  name,
  rut: `${id}-k`,
  date: '2026-02-10',
  type: 'Policlinico',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
  attachedFiles: [],
});

describe('patient records use-cases', () => {
  it('dedupes records by id and keeps the newest one', () => {
    const base = [
      { ...makePatient('1', 'A-old'), updatedAt: 10 },
      { ...makePatient('1', 'A-new'), updatedAt: 20 },
      makePatient('2', 'B'),
    ];
    const result = setPatientRecords(base);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('A-new');
    expect(result[1].id).toBe('2');
  });

  it('adds patient with updatedAt', () => {
    const now = 123456;
    const base = [makePatient('1', 'A')];
    const result = addPatientRecord(base, makePatient('2', 'B'), now);

    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('2');
    expect(result[1].updatedAt).toBe(now);
  });

  it('updates existing patient with updatedAt', () => {
    const now = 777;
    const base = [makePatient('1', 'A'), makePatient('2', 'B')];
    const result = updatePatientRecord(base, makePatient('2', 'B2'), now);

    expect(result[1].name).toBe('B2');
    expect(result[1].updatedAt).toBe(now);
    expect(result[0].name).toBe('A');
  });

  it('upserts patient when update target does not exist', () => {
    const now = 999;
    const base = [makePatient('1', 'A')];
    const result = updatePatientRecord(base, makePatient('3', 'C'), now);

    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('3');
    expect(result[1].updatedAt).toBe(now);
  });

  it('deletes patient by id', () => {
    const base = [makePatient('1', 'A'), makePatient('2', 'B')];
    const result = deletePatientRecord(base, '1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});
