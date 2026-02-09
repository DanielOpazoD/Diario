import { describe, expect, it } from 'vitest';
import { buildPatientPayload } from '@use-cases/patient/buildPayload';
import type { PatientTypeConfig } from '@shared/types';

const patientTypes: PatientTypeConfig[] = [
  { id: 'policlinico', label: 'Policlinico', colorClass: 'text-blue-600' },
];

describe('buildPatientPayload', () => {
  it('normalizes pending tasks and keeps payload stable for missing task ids', () => {
    const payload = buildPatientPayload({
      initialData: null,
      selectedDate: '2026-02-07',
      patientTypes,
      name: '  juan perez  ',
      rut: '11-1',
      birthDate: '',
      gender: '',
      type: 'Policlinico',
      typeId: 'policlinico',
      entryTime: '',
      exitTime: '',
      diagnosis: ' dx ',
      clinicalNote: ' note ',
      pendingTasks: [
        { id: '', text: '  revisar examen  ', isCompleted: false },
        { id: 'keep-id', text: '   ', isCompleted: false },
        { id: 't2', text: 'control', isCompleted: true, completionNote: ' ok ' },
      ],
      attachedFiles: [],
      patientId: 'patient-1',
      driveFolderId: null,
    });

    expect(payload.pendingTasks).toEqual([
      { id: 'task-0', text: 'revisar examen', isCompleted: false, completionNote: undefined },
      { id: 't2', text: 'control', isCompleted: true, completionNote: 'ok' },
    ]);
  });

  it('filters attached files without required fields', () => {
    const payload = buildPatientPayload({
      initialData: null,
      selectedDate: '2026-02-07',
      patientTypes,
      name: 'Paciente',
      rut: '11-1',
      birthDate: '',
      gender: '',
      type: 'Policlinico',
      typeId: 'policlinico',
      entryTime: '',
      exitTime: '',
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [
        { id: 'file-1', name: 'lab.pdf' } as any,
        { id: '', name: 'missing-id.pdf' } as any,
        { id: 'file-2' } as any,
      ],
      patientId: 'patient-1',
      driveFolderId: null,
    });

    expect(payload.attachedFiles).toEqual([{ id: 'file-1', name: 'lab.pdf' }]);
  });
});
