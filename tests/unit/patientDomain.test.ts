import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildNewPatient, buildUpdatedPatient, normalizePatientName } from '@domain/patient';
import type { PatientCreateInput, PatientRecord } from '@shared/types';

describe('patient domain', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes patient name to title case', () => {
    expect(normalizePatientName('juan pÉREZ')).toBe('Juan Pérez');
  });

  it('builds new patient with defaults', () => {
    const payload: PatientCreateInput = {
      name: 'maria LOPEZ',
      rut: '',
      birthDate: '',
      gender: '',
      date: '2024-01-02',
      type: 'Hospitalizado',
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [],
    };

    const result = buildNewPatient(payload);

    expect(result.id).toBeTruthy();
    expect(result.createdAt).toBe(1700000000000);
    expect(result.name).toBe('Maria Lopez');
    expect(result.pendingTasks).toEqual([]);
    expect(result.attachedFiles).toEqual([]);
  });

  it('builds updated patient preserving id and createdAt', () => {
    const existing: PatientRecord = {
      id: 'p1',
      name: 'Old Name',
      rut: '',
      date: '2024-01-01',
      type: 'Policlínico',
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [],
      createdAt: 123,
    };
    const payload = { ...existing, name: 'nuevo nombre' };

    const result = buildUpdatedPatient(existing, payload);

    expect(result.id).toBe('p1');
    expect(result.createdAt).toBe(123);
    expect(result.name).toBe('Nuevo Nombre');
  });
});
