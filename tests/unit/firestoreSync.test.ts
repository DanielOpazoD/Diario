import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/firebase/auth', () => ({
  getAuthInstance: vi.fn(async () => null),
}));

vi.mock('../../src/services/firebase/firestore', () => ({
  getFirestoreInstance: vi.fn(async () => null),
}));

import {
  addPendingDeletion,
  isPendingDeletion,
  syncPatientsToFirebase,
  syncIncrementalPatientsToFirebase,
  subscribeToPatients,
  savePatientToFirebase,
  deletePatientFromFirebase,
} from '../../src/services/firebase/firestoreSync';

describe('firestoreSync helpers', () => {
  it('tracks pending deletions with expiration', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1_000);

    addPendingDeletion('patient-1');
    expect(isPendingDeletion('patient-1')).toBe(true);

    now.mockReturnValue(40_001);
    expect(isPendingDeletion('patient-1')).toBe(false);

    now.mockRestore();
  });

  it('short-circuits Firebase operations when deps are unavailable', async () => {
    await expect(syncPatientsToFirebase([])).resolves.toBeUndefined();
    await expect(syncIncrementalPatientsToFirebase([])).resolves.toBeUndefined();
    await expect(savePatientToFirebase({
      id: 'p1',
      name: 'Paciente',
      rut: '1-9',
      diagnosis: '',
      clinicalNote: '',
      date: '2026-01-31',
      type: 'Policlínico',
      pendingTasks: [],
      attachedFiles: [],
      createdAt: 0,
      updatedAt: 0,
      gender: 'Otro',
      birthDate: '2000-01-01',
    })).resolves.toBeUndefined();
    await expect(deletePatientFromFirebase('p1')).resolves.toBeUndefined();

    const unsubscribe = subscribeToPatients(() => {});
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
