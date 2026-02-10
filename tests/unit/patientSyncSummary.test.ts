import { describe, expect, it } from 'vitest';
import type { PatientRecord } from '@shared/types';
import {
  areRecordCollectionsEquivalent,
  buildSyncSummaryText,
  countSyncChanges,
  shouldApplyReconciledRecords,
} from '@use-cases/patient/syncSummary';

const makePatient = (id: string, updatedAt = 0, createdAt = 0): PatientRecord => ({
  id,
  name: `P-${id}`,
  rut: `${id}-k`,
  date: '2026-02-10',
  type: 'Policlinico',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
  attachedFiles: [],
  updatedAt,
  createdAt,
});

describe('patient sync summary use-cases', () => {
  it('detects equivalent record collections', () => {
    const current = [makePatient('1', 10, 1), makePatient('2', 20, 2)];
    const next = [makePatient('1', 10, 1), makePatient('2', 20, 2)];
    expect(areRecordCollectionsEquivalent(current, next)).toBe(true);
  });

  it('detects non-equivalent record collections', () => {
    const current = [makePatient('1', 10, 1)];
    const next = [makePatient('1', 11, 1)];
    expect(areRecordCollectionsEquivalent(current, next)).toBe(false);
  });

  it('detects non-equivalent collections when payload changes without timestamp change', () => {
    const current = [makePatient('1', 10, 1)];
    const next = [{ ...makePatient('1', 10, 1), diagnosis: 'Nuevo dx' }];
    expect(areRecordCollectionsEquivalent(current, next)).toBe(false);
  });

  it('counts and formats sync changes', () => {
    const counts = countSyncChanges([
      { type: 'add', id: '1' },
      { type: 'add', id: '2' },
      { type: 'update', id: '3' },
      { type: 'remove', id: '4' },
    ]);
    expect(counts).toEqual({ add: 2, update: 1, remove: 1 });
    expect(buildSyncSummaryText(counts)).toBe('Anadidos: 2 · Actualizados: 1 · Eliminados: 1');
  });

  it('applies reconciled records only when changed and non-equivalent', () => {
    const current = [makePatient('1', 10, 1)];
    const nextEquivalent = [makePatient('1', 10, 1)];
    const nextDifferent = [makePatient('1', 11, 1)];

    expect(shouldApplyReconciledRecords(current, nextEquivalent, true)).toBe(false);
    expect(shouldApplyReconciledRecords(current, nextDifferent, true)).toBe(true);
    expect(shouldApplyReconciledRecords(current, nextDifferent, false)).toBe(false);
  });
});
