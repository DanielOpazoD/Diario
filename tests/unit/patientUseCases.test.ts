import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { savePatient } from '@use-cases/patient/save';
import { movePatientsToDate } from '@use-cases/patient/move';
import { copyPatientsToDate } from '@use-cases/patient/copy';
import type { PatientCreateInput, PatientRecord } from '@shared/types';

describe('patient use-cases', () => {
  const nowSpy = vi.spyOn(Date, 'now');
  const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID');

  beforeEach(() => {
    nowSpy.mockReturnValue(1700000000000);
    uuidSpy.mockReturnValue('00000000-0000-0000-0000-000000000000');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('savePatient creates new patient when no editing patient', () => {
    const payload: PatientCreateInput = {
      name: 'juan',
      rut: '',
      date: '2024-01-02',
      type: 'Policlínico',
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [],
    };

    const result = savePatient(payload, null);

    expect(result.isUpdate).toBe(false);
    expect(result.patient.id).toBe('00000000-0000-0000-0000-000000000000');
    expect(result.message).toBe('Nuevo paciente registrado');
  });

  it('savePatient updates existing patient', () => {
    const existing: PatientRecord = {
      id: 'p1',
      name: 'Old',
      rut: '',
      date: '2024-01-01',
      type: 'Policlínico',
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [],
      createdAt: 123,
    };
    const payload = { ...existing, name: 'nuevo' };

    const result = savePatient(payload, existing);

    expect(result.isUpdate).toBe(true);
    expect(result.patient.id).toBe('p1');
    expect(result.message).toBe('Paciente actualizado');
  });

  it('movePatientsToDate returns error when missing target date', () => {
    const result = movePatientsToDate([], ['p1'], '');
    expect(result.ok).toBe(false);
    expect(result.level).toBe('error');
  });

  it('copyPatientsToDate returns info when no patients match', () => {
    const result = copyPatientsToDate([], ['p1'], '2024-01-02');
    expect(result.ok).toBe(false);
    expect(result.level).toBe('info');
  });
});
