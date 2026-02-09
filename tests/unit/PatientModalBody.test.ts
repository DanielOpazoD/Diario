import { describe, expect, it } from 'vitest';
import { buildPatientPayload } from '@use-cases/patient/buildPayload';
import { PatientTypeConfig, PatientRecord } from '@shared/types';

const patientTypes: PatientTypeConfig[] = [
  { id: 'policlinico', label: 'Policlínico', colorClass: 'bg-blue-500' },
  { id: 'hospitalizado', label: 'Hospitalizado', colorClass: 'bg-red-500' },
];

describe('buildPatientPayload', () => {
  it('builds a create payload with selected type and date', () => {
    const payload = buildPatientPayload({
      selectedDate: '2025-02-01',
      patientTypes,
      name: 'Juan Perez',
      rut: '12.345.678-9',
      birthDate: '1990-01-01',
      gender: 'M',
      type: 'Policlínico',
      typeId: 'policlinico',
      entryTime: '',
      exitTime: '',
      diagnosis: 'Dx',
      clinicalNote: 'Nota',
      pendingTasks: [],
      attachedFiles: [],
      patientId: 'patient-new',
      driveFolderId: null,
    });

    expect(payload).toMatchObject({
      id: 'patient-new',
      type: 'Policlínico',
      typeId: 'policlinico',
      date: '2025-02-01',
      rut: '12.345.678-9',
    });
  });

  it('builds an update payload without overriding id', () => {
    const initialData: PatientRecord = {
      id: 'patient-1',
      name: 'Paciente Uno',
      rut: '1-9',
      date: '2025-02-01',
      type: 'Hospitalizado',
      typeId: 'hospitalizado',
      diagnosis: 'Dx',
      clinicalNote: 'Nota',
      pendingTasks: [],
      attachedFiles: [],
    };

    const payload = buildPatientPayload({
      initialData,
      selectedDate: '2025-02-01',
      patientTypes,
      name: 'Paciente Uno',
      rut: '1-9',
      birthDate: '',
      gender: '',
      type: 'Hospitalizado',
      typeId: 'hospitalizado',
      entryTime: '',
      exitTime: '',
      diagnosis: 'Dx',
      clinicalNote: 'Nota',
      pendingTasks: [],
      attachedFiles: [],
      patientId: 'patient-new',
      driveFolderId: null,
    });

    expect(payload).toMatchObject({
      id: 'patient-1',
      type: 'Hospitalizado',
      typeId: 'hospitalizado',
    });
  });
});
