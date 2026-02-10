import { describe, expect, it } from 'vitest';
import type { PatientRecord } from '@shared/types';
import { createRepairPatientAttachments } from '@use-cases/patient/repairAttachments';

const createRecord = (overrides: Partial<PatientRecord> = {}): PatientRecord => ({
  id: 'p-1',
  name: 'Paciente Uno',
  rut: '1-9',
  date: '2026-02-10',
  type: 'Policlínico',
  typeId: 'policlinico',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
  attachedFiles: [],
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe('repairPatientAttachments use-case', () => {
  it('repairs attachments from storage by patientId', async () => {
    const repair = createRepairPatientAttachments({
      listAllPatientFilesFn: async () => ({
        'p-1': [
          {
            id: 'file-1',
            name: 'informe.pdf',
            mimeType: 'application/pdf',
            size: 12,
            uploadedAt: 100,
            driveUrl: 'https://example.com/informe.pdf',
          },
        ],
      }),
    });

    const result = await repair([createRecord()]);

    expect(result.repairedPatients).toBe(1);
    expect(result.recoveredFiles).toBe(1);
    expect(result.scannedPatientFolders).toBe(1);
    expect(result.records[0].attachedFiles).toHaveLength(1);
    expect(result.records[0].attachedFiles[0].id).toBe('file-1');
  });

  it('falls back to same-rut attachments when direct folder is empty', async () => {
    const repair = createRepairPatientAttachments({
      listAllPatientFilesFn: async () => ({
        'p-a': [
          {
            id: 'file-a',
            name: 'epicrisis.pdf',
            mimeType: 'application/pdf',
            size: 30,
            uploadedAt: 120,
            driveUrl: 'https://example.com/epicrisis.pdf',
          },
        ],
      }),
    });

    const result = await repair([
      createRecord({ id: 'p-a', rut: '10-1' }),
      createRecord({ id: 'p-b', rut: '10-1' }),
    ]);

    expect(result.repairedPatients).toBe(2);
    expect(result.linkedByRutPatients).toBe(1);
    expect(result.records[1].attachedFiles).toHaveLength(1);
    expect(result.records[1].attachedFiles[0].id).toBe('file-a');
  });
});

