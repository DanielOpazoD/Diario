import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  safeParseWithLogging,
  validateAttachedFile,
  validatePatientRecord,
  validatePatientRecords,
  validatePendingTask,
} from '@shared/utils/validation';
import { PatientRecordSchema } from '@shared/schemas';

describe('validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates patient record and defaults fields', () => {
    const result = validatePatientRecord({
      id: 'p1',
      name: 'Ana',
      rut: '1-9',
      date: '2026-01-31',
      type: 'Hospitalizado',
    });
    expect(result.success).toBe(true);
    expect(result.data?.pendingTasks).toEqual([]);
    expect(result.data?.attachedFiles).toEqual([]);
  });

  it('validates pending tasks and attached files', () => {
    const task = validatePendingTask({ id: 't1', text: 'Tarea', isCompleted: false });
    expect(task.success).toBe(true);

    const file = validateAttachedFile({
      id: 'f1',
      name: 'doc.pdf',
      mimeType: 'application/pdf',
      size: 10,
      uploadedAt: Date.now(),
      driveUrl: 'https://example.com/doc.pdf',
    });
    expect(file.success).toBe(true);
  });

  it('returns errors for invalid pending tasks and attached files', () => {
    const task = validatePendingTask({ text: 'Tarea' } as any);
    expect(task.success).toBe(false);
    expect(task.errors?.length).toBeGreaterThan(0);

    const file = validateAttachedFile({ name: 'doc.pdf' } as any);
    expect(file.success).toBe(false);
    expect(file.errors?.length).toBeGreaterThan(0);
  });

  it('returns detailed errors for invalid records', () => {
    const result = validatePatientRecords([
      { name: 'Missing id' },
      { id: 'ok', name: 'Ok', date: '2026-01-31', type: 'Turno' },
    ] as any);
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain('[Record 0]');
  });

  it('accepts a valid batch without errors', () => {
    const result = validatePatientRecords([
      {
        id: 'p1',
        name: 'Ana',
        rut: '1-9',
        date: '2026-01-31',
        type: 'Hospitalizado',
      },
      {
        id: 'p2',
        name: 'Juan',
        rut: '2-7',
        date: '2026-01-31',
        type: 'Policlínico',
      },
    ] as any);
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('logs validation errors on safe parse', () => {
    const onError = vi.fn();
    const parsed = safeParseWithLogging(
      PatientRecordSchema,
      { name: 'Missing id' },
      'PatientRecord',
      onError,
    );
    expect(parsed).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('returns parsed data without logging when valid', () => {
    const onError = vi.fn();
    const parsed = safeParseWithLogging(
      PatientRecordSchema,
      { id: 'p1', name: 'Ana', rut: '1-9', date: '2026-01-31', type: 'Hospitalizado' },
      'PatientRecord',
      onError,
    );
    expect(parsed).toBeTruthy();
    expect(onError).not.toHaveBeenCalled();
  });

  it('normalizes legacy patient type labels and infers missing typeId', () => {
    const parsed = PatientRecordSchema.parse({
      id: 'p-legacy',
      name: 'Ana',
      rut: '1-9',
      date: '2026-02-08',
      type: 'Policlinico',
    });

    expect(parsed.type).toBe('Policlínico');
    expect(parsed.typeId).toBe('policlinico');
  });

  it('drops invalid pending tasks and attached files during normalization', () => {
    const parsed = PatientRecordSchema.parse({
      id: 'p-normalize',
      name: 'Ana',
      rut: '1-9',
      date: '2026-02-08',
      type: 'Hospitalizado',
      pendingTasks: [
        { text: '  validar  ', isCompleted: false },
        { text: '   ', isCompleted: false },
      ],
      attachedFiles: [
        {
          id: 'f1',
          name: 'doc.pdf',
          mimeType: 'application/pdf',
          size: 1,
          uploadedAt: 1,
          driveUrl: 'https://example.com/doc.pdf',
        },
        { id: 'f2', name: 'bad file', driveUrl: 'notaurl' },
      ],
    });

    expect(parsed.pendingTasks).toHaveLength(1);
    expect(parsed.pendingTasks[0].text).toBe('validar');
    expect(parsed.attachedFiles).toHaveLength(1);
    expect(parsed.attachedFiles[0].id).toBe('f1');
  });
});
