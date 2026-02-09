import { describe, expect, it, vi } from 'vitest';
import { getStorageInstance } from '@services/firebase/storage';

vi.mock('@services/firebaseConfig', () => ({
  getFirebaseStorage: vi.fn(async () => ({ id: 'storage' })),
}));

describe('getStorageInstance', () => {
  it('returns firebase storage instance', async () => {
    const instance = await getStorageInstance();
    expect(instance).toEqual({ id: 'storage' });
  });
});
