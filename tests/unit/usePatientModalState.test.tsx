import { renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import usePatientModalState from '@core/patient/hooks/usePatientModalState';
import { PatientType, PatientTypeConfig, PatientRecord } from '@shared/types';

describe('usePatientModalState', () => {
  const patientTypes: PatientTypeConfig[] = [
    { id: 'type-1', label: PatientType.POLICLINICO, colorClass: 'bg-blue-500' },
    { id: 'type-2', label: PatientType.HOSPITALIZADO, colorClass: 'bg-red-500' },
  ];

  beforeEach(() => {
    Object.defineProperty(global, 'crypto', {
      value: { randomUUID: () => 'uuid-123' },
      configurable: true,
    });
  });

  it('loads initial data when open', () => {
    const initialData: PatientRecord = {
      id: 'patient-1',
      name: 'Paciente Uno',
      rut: '1-9',
      birthDate: '2000-01-01',
      gender: 'F',
      date: '2025-01-01',
      type: PatientType.HOSPITALIZADO,
      typeId: 'type-2',
      entryTime: '08:00',
      exitTime: '10:00',
      diagnosis: 'Dx',
      clinicalNote: 'Nota',
      pendingTasks: [],
      attachedFiles: [],
    };

    const { result } = renderHook(() =>
      usePatientModalState({
        isOpen: true,
        initialData,
        initialTab: 'files',
        defaultTypeId: 'type-1',
        patientTypes,
      })
    );

    expect(result.current.patientId).toBe('patient-1');
    expect(result.current.name).toBe('Paciente Uno');
    expect(result.current.rut).toBe('1-9');
    expect(result.current.birthDate).toBe('2000-01-01');
    expect(result.current.gender).toBe('F');
    expect(result.current.type).toBe(PatientType.HOSPITALIZADO);
    expect(result.current.typeId).toBe('type-2');
    expect(result.current.activeTab).toBe('files');
    expect(result.current.isEditingDemographics).toBe(false);
  });

  it('initializes new patient when no initial data', () => {
    const { result } = renderHook(() =>
      usePatientModalState({
        isOpen: true,
        initialData: null,
        initialTab: 'clinical',
        defaultTypeId: 'type-1',
        patientTypes,
      })
    );

    expect(result.current.patientId).toBe('uuid-123');
    expect(result.current.name).toBe('');
    expect(result.current.type).toBe(PatientType.POLICLINICO);
    expect(result.current.typeId).toBe('type-1');
    expect(result.current.pendingTasks).toEqual([]);
    expect(result.current.attachedFiles).toEqual([]);
    expect(result.current.isEditingDemographics).toBe(true);
    expect(result.current.activeTab).toBe('clinical');
  });

  it('resolves typeId from patientTypes when missing', () => {
    const initialData: PatientRecord = {
      id: 'patient-2',
      name: 'Paciente Dos',
      rut: '2-7',
      date: '2025-01-02',
      type: PatientType.POLICLINICO,
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [],
    };

    const { result } = renderHook(() =>
      usePatientModalState({
        isOpen: true,
        initialData,
        initialTab: 'clinical',
        defaultTypeId: 'default-type',
        patientTypes,
      })
    );

    expect(result.current.typeId).toBe('type-1');
  });

  it('does not update when closed', () => {
    const initialData: PatientRecord = {
      id: 'patient-3',
      name: 'Paciente Tres',
      rut: '3-5',
      date: '2025-01-03',
      type: PatientType.EXTRA,
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [],
    };

    const { result } = renderHook(() =>
      usePatientModalState({
        isOpen: false,
        initialData,
        initialTab: 'clinical',
        defaultTypeId: 'type-1',
        patientTypes,
      })
    );

    expect(result.current.name).toBe('');
    expect(result.current.rut).toBe('');
  });
});
