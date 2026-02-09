import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatientRecord } from '@shared/types';

const syncPatientsMock = vi.fn();
const subscribeToPatientsMock = vi.fn();
const logEventMock = vi.fn();

vi.mock('@data/adapters/firebasePatientSyncAdapter', () => ({
  firebasePatientSyncAdapter: {
    syncPatients: syncPatientsMock,
    subscribeToPatients: subscribeToPatientsMock,
  },
}));

vi.mock('@use-cases/logger', () => ({
  logEvent: logEventMock,
}));

const buildPatient = (id: string): PatientRecord => ({
  id,
  name: 'Paciente',
  rut: '1-9',
  date: '2026-02-07',
  type: 'Policlinico',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
  attachedFiles: [],
});

describe('syncPatientsWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries and eventually succeeds', async () => {
    syncPatientsMock
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(undefined);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { syncPatientsWithRetry } = await import('@use-cases/patientSync');

    await expect(syncPatientsWithRetry([buildPatient('p1')], 3, 1, 1000)).resolves.toBeUndefined();
    expect(syncPatientsMock).toHaveBeenCalledTimes(3);
    expect(logEventMock).toHaveBeenCalledWith(
      'warn',
      'PatientSync',
      'Sync attempt failed',
      expect.objectContaining({ attempt: 1, maxAttempts: 3, patientCount: 1 })
    );
  });

  it('fails with timeout when one attempt exceeds deadline', async () => {
    syncPatientsMock.mockImplementation(() => new Promise(() => {}));

    const { syncPatientsWithRetry } = await import('@use-cases/patientSync');

    await expect(syncPatientsWithRetry([buildPatient('p2')], 1, 1, 20)).rejects.toThrow(
      /timed out/
    );
    expect(logEventMock).toHaveBeenCalledWith(
      'error',
      'PatientSync',
      'Sync retries exhausted',
      expect.objectContaining({ attempts: 1, patientCount: 1 })
    );
  });

  it('fails fast for non-retryable auth/permission errors', async () => {
    syncPatientsMock.mockRejectedValueOnce(new Error('permission-denied: missing scope'));

    const { syncPatientsWithRetry } = await import('@use-cases/patientSync');

    await expect(syncPatientsWithRetry([buildPatient('p3')], 5, 1, 1000)).rejects.toThrow(
      /permission-denied/
    );
    expect(syncPatientsMock).toHaveBeenCalledTimes(1);
    expect(logEventMock).toHaveBeenCalledWith(
      'warn',
      'PatientSync',
      'Sync attempt failed',
      expect.objectContaining({ attempt: 1, nonRetryable: true })
    );
  });

  it('returns early when there are no patients to sync', async () => {
    const { syncPatientsWithRetry } = await import('@use-cases/patientSync');
    await expect(syncPatientsWithRetry([], 3, 1, 1000)).resolves.toBeUndefined();
    expect(syncPatientsMock).not.toHaveBeenCalled();
  });

  it('throws for invalid retry configuration', async () => {
    const { syncPatientsWithRetry } = await import('@use-cases/patientSync');

    await expect(syncPatientsWithRetry([buildPatient('p4')], 0, 1, 1000)).rejects.toThrow(
      /maxAttempts/
    );
    await expect(syncPatientsWithRetry([buildPatient('p4')], 1, -1, 1000)).rejects.toThrow(
      /baseDelayMs/
    );
    await expect(syncPatientsWithRetry([buildPatient('p4')], 1, 1, -1)).rejects.toThrow(
      /attemptTimeoutMs/
    );
  });
});
