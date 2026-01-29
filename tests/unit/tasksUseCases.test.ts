import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGeneralTask, togglePatientTask } from '@use-cases/tasks';
import type { PatientRecord } from '@shared/types';

describe('tasks use-cases', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('task-uuid');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createGeneralTask returns null for empty text', () => {
    expect(createGeneralTask('   ')).toBeNull();
  });

  it('createGeneralTask builds a task', () => {
    const result = createGeneralTask('Revisar labs');
    expect(result?.id).toBeTruthy();
    expect(result?.text).toBe('Revisar labs');
    expect(result?.createdAt).toBe(1700000000000);
  });

  it('togglePatientTask returns updated patient', () => {
    const patient: PatientRecord = {
      id: 'p1',
      name: 'Paciente',
      rut: '',
      date: '2024-01-01',
      type: 'Policlínico',
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [{ id: 't1', text: 'Task', isCompleted: false }],
      attachedFiles: [],
    };

    const result = togglePatientTask([patient], 'p1', 't1');

    expect(result?.pendingTasks[0].isCompleted).toBe(true);
  });
});
