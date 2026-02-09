import { describe, expect, it, vi } from 'vitest';

const mockCommit = vi.fn();
const mockSet = vi.fn();

vi.mock('../../src/services/firebase/auth', () => ({
  getAuthInstance: vi.fn(async () => ({ currentUser: { uid: 'user-1' } })),
}));

vi.mock('../../src/services/firebase/firestore', () => ({
  getFirestoreInstance: vi.fn(async () => ({})),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({
    set: mockSet,
    commit: mockCommit,
  })),
  onSnapshot: vi.fn(() => () => {}),
  setDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
}));

const buildPatient = (id: string, updatedAt = 0) => ({
  id,
  name: 'Paciente',
  rut: '1-9',
  date: '2026-01-31',
  type: 'Hospitalizado',
  pendingTasks: [],
  attachedFiles: [],
  diagnosis: '',
  clinicalNote: '',
  updatedAt,
});

describe('firestoreSync branches', () => {
  it('skips sync when state hash is unchanged', async () => {
    vi.resetModules();
    const firestoreSync = await import('../../src/services/firebase/firestoreSync');
    const patients = [buildPatient('p1', 10)];
    mockCommit.mockClear();

    await firestoreSync.syncPatientsToFirebase(patients as any);
    await firestoreSync.syncPatientsToFirebase(patients as any);

    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it('logs and rethrows when incremental sync fails', async () => {
    mockCommit.mockRejectedValueOnce(new Error('boom'));
    vi.resetModules();
    const firestoreSync = await import('../../src/services/firebase/firestoreSync');
    await expect(
      firestoreSync.syncIncrementalPatientsToFirebase([buildPatient('p2', 20)] as any)
    ).rejects.toThrow('boom');
  });
});
