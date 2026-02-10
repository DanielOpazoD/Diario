import { describe, expect, it } from 'vitest';
import type { PatientRecord, PatientTypeConfig } from '@shared/types';
import { buildInlineUpdatedPatient } from '@use-cases/patient/buildInlineUpdate';

const patientTypes: PatientTypeConfig[] = [
  { id: 'policlinico', label: 'Policlínico', colorClass: 'text-blue-600' },
];

const patient: PatientRecord = {
  id: 'patient-1',
  name: 'Nombre Base',
  rut: '1-9',
  date: '2026-02-10',
  type: 'Policlínico',
  typeId: 'policlinico',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
  attachedFiles: [],
};

describe('buildInlineUpdatedPatient', () => {
  it('normalizes tasks and attachments with the same rules as create payload', () => {
    const updated = buildInlineUpdatedPatient({
      patient,
      patientTypes,
      name: '  juan perez ',
      rut: '1-9',
      birthDate: '',
      gender: '',
      type: 'Policlínico',
      typeId: 'policlinico',
      entryTime: '',
      exitTime: '',
      diagnosis: ' dx ',
      clinicalNote: ' note ',
      pendingTasks: [
        { id: '', text: '  revisar  ', isCompleted: false },
        { id: 'keep', text: '   ', isCompleted: false },
      ],
      attachedFiles: [
        { id: 'f1', name: 'ok.pdf' } as any,
        { id: '', name: 'bad.pdf' } as any,
      ],
      driveFolderId: null,
    });

    expect(updated.name).toBe('Juan Perez');
    expect(updated.pendingTasks).toEqual([
      { id: 'task-0', text: 'revisar', isCompleted: false, completionNote: undefined },
    ]);
    expect(updated.attachedFiles).toEqual([{ id: 'f1', name: 'ok.pdf' }]);
  });
});
