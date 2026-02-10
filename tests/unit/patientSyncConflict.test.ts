import { describe, expect, it } from 'vitest';
import type { PatientRecord } from '@shared/types';
import { isLocalRecordWithinGracePeriod, resolvePatientConflict } from '@use-cases/patient/syncConflict';

const buildPatient = (
  id: string,
  timestamps?: { updatedAt?: number; createdAt?: number; syncUpdatedAt?: number }
): PatientRecord => ({
  id,
  name: 'Paciente',
  rut: '1-9',
  date: '2026-02-10',
  type: 'Hospitalizado',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
  attachedFiles: [],
  updatedAt: timestamps?.updatedAt,
  createdAt: timestamps?.createdAt,
  syncMeta: timestamps?.syncUpdatedAt ? { updatedAt: timestamps.syncUpdatedAt } : undefined,
});

describe('patient sync conflict policy', () => {
  it('uses updatedAt as first decision key', () => {
    const local = buildPatient('p1', { updatedAt: 10 });
    const remote = buildPatient('p1', { updatedAt: 20 });
    const decision = resolvePatientConflict(local, remote, 'newer-wins-local-tie');
    expect(decision.winner).toBe('remote');
    expect(decision.reason).toBe('newer-updatedAt');
  });

  it('uses syncMeta.updatedAt when updatedAt is equal', () => {
    const local = buildPatient('p1', { updatedAt: 20, syncUpdatedAt: 50 });
    const remote = buildPatient('p1', { updatedAt: 20, syncUpdatedAt: 60 });
    const decision = resolvePatientConflict(local, remote, 'newer-wins-local-tie');
    expect(decision.winner).toBe('remote');
    expect(decision.reason).toBe('newer-syncMetaUpdatedAt');
  });

  it('applies tie policy when timestamps are equal', () => {
    const local = buildPatient('p1', { updatedAt: 20, createdAt: 10, syncUpdatedAt: 30 });
    const remote = {
      ...buildPatient('p1', { updatedAt: 20, createdAt: 10, syncUpdatedAt: 30 }),
      diagnosis: 'dx diferente',
    };
    const localTie = resolvePatientConflict(local, remote, 'newer-wins-local-tie');
    const remoteTie = resolvePatientConflict(local, remote, 'newer-wins-remote-tie');
    expect(localTie.winner).toBe('local');
    expect(remoteTie.winner).toBe('remote');
  });

  it('returns identical-content when payload and version are equal', () => {
    const local = buildPatient('p1', { updatedAt: 20, createdAt: 10, syncUpdatedAt: 30 });
    const remote = buildPatient('p1', { updatedAt: 20, createdAt: 10, syncUpdatedAt: 30 });
    const decision = resolvePatientConflict(local, remote, 'newer-wins-remote-tie');
    expect(decision.winner).toBe('local');
    expect(decision.reason).toBe('identical-content');
  });

  it('keeps local record when it is still in grace period', () => {
    const local = buildPatient('p1', { updatedAt: 10_000 });
    expect(isLocalRecordWithinGracePeriod(local, 12_000, 5_000)).toBe(true);
    expect(isLocalRecordWithinGracePeriod(local, 20_001, 5_000)).toBe(false);
  });
});
