import { describe, expect, it } from 'vitest';
import { reconcilePatientRecords } from '@use-cases/patientSyncMerge';
import type { PatientRecord } from '@shared/types';

const buildPatient = (id: string, updatedAt?: number, createdAt = 0, name = 'Paciente'): PatientRecord => ({
  id,
  name,
  rut: '1-9',
  date: '2026-01-31',
  type: 'Hospitalizado',
  pendingTasks: [],
  attachedFiles: [],
  diagnosis: '',
  clinicalNote: '',
  updatedAt,
  createdAt,
});

describe('reconcilePatientRecords', () => {
  it('prefers remote when newer and tracks updates', () => {
    const local = [buildPatient('p1', 10)];
    const remote = [buildPatient('p1', 20, 0, 'Remote')];

    const result = reconcilePatientRecords(local, remote, 1000, 30000);

    expect(result.hasChanges).toBe(true);
    expect(result.records[0].name).toBe('Remote');
    expect(result.changes).toEqual([{ type: 'update', id: 'p1' }]);
  });

  it('keeps local when remote is not newer', () => {
    const local = [buildPatient('p1', 20, 0, 'Local')];
    const remote = [buildPatient('p1', 10, 0, 'Remote')];

    const result = reconcilePatientRecords(local, remote, 1000, 30000);

    expect(result.hasChanges).toBe(false);
    expect(result.records[0].name).toBe('Local');
  });

  it('keeps local when timestamps are equal', () => {
    const local = [buildPatient('p1', 10, 0, 'Local')];
    const remote = [buildPatient('p1', 10, 0, 'Remote')];

    const result = reconcilePatientRecords(local, remote, 1000, 30000);

    expect(result.hasChanges).toBe(false);
    expect(result.records[0].name).toBe('Local');
  });

  it('can prefer remote on equal timestamps when policy requires it', () => {
    const local = [buildPatient('p1', 10, 0, 'Local')];
    const remote = [buildPatient('p1', 10, 0, 'Remote')];

    const result = reconcilePatientRecords(local, remote, 1000, 30000, 'newer-wins-remote-tie');

    expect(result.hasChanges).toBe(true);
    expect(result.records[0].name).toBe('Remote');
    expect(result.changes).toEqual([{ type: 'update', id: 'p1' }]);
  });

  it('uses createdAt when updatedAt is missing', () => {
    const now = 1000;
    const local = [buildPatient('p1', undefined, 900, 'Local')];

    const result = reconcilePatientRecords(local, [], now, 200);

    expect(result.hasChanges).toBe(false);
    expect(result.records).toHaveLength(1);
  });

  it('keeps local when remote missing but within grace period', () => {
    const now = 1000;
    const local = [buildPatient('p1', 900)];

    const result = reconcilePatientRecords(local, [], now, 200);

    expect(result.hasChanges).toBe(false);
    expect(result.records).toHaveLength(1);
  });

  it('removes local when remote missing and stale', () => {
    const now = 1000;
    const local = [buildPatient('p1', undefined, 1)];

    const result = reconcilePatientRecords(local, [], now, 200);

    expect(result.hasChanges).toBe(true);
    expect(result.records).toHaveLength(0);
    expect(result.changes[0].type).toBe('remove');
  });

  it('adds remote-only records', () => {
    const local: PatientRecord[] = [];
    const remote = [buildPatient('p2', 5)];

    const result = reconcilePatientRecords(local, remote, 1000, 30000);

    expect(result.hasChanges).toBe(true);
    expect(result.records).toHaveLength(1);
    expect(result.changes[0].type).toBe('add');
  });

  it('protects against suspicious mass removals from a sparse remote snapshot', () => {
    const now = 1_000_000;
    const local = Array.from({ length: 10 }, (_, index) => (
      buildPatient(`p${index + 1}`, now - 60_000, now - 60_000, `Local-${index + 1}`)
    ));
    const remote = [buildPatient('p1', now - 60_000, now - 60_000, 'Remote-1')];

    const result = reconcilePatientRecords(local, remote, now, 10_000);

    expect(result.records).toHaveLength(10);
    expect(result.changes).toHaveLength(0);
    expect(result.stats.protectedRemovals).toBe(9);
    expect(result.stats.staleRemovals).toBe(0);
  });
});
