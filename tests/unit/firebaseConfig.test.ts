import { describe, expect, it, vi } from 'vitest';

describe('firebaseConfig', () => {
  it('returns null when firebase is not configured', async () => {
    vi.resetModules();
    vi.doMock('@shared/config/env', () => ({
      env: {
        firebase: {
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
        },
        flags: { isFirebaseConfigured: false },
      },
    }));

    const { getFirebaseAuth } = await import('@services/firebaseConfig');
    const auth = await getFirebaseAuth();
    expect(auth).toBeNull();
  });

  it('initializes firebase services when configured', async () => {
    vi.resetModules();
    const initializeApp = vi.fn().mockReturnValue({ name: 'app' });
    const getAuth = vi.fn().mockReturnValue({ name: 'auth' });
    const getFirestore = vi.fn().mockReturnValue({ name: 'db' });
    const getStorage = vi.fn().mockReturnValue({ name: 'storage' });

    vi.doMock('@shared/config/env', () => ({
      env: {
        firebase: {
          apiKey: 'a',
          authDomain: 'b',
          projectId: 'c',
          storageBucket: 'd',
          messagingSenderId: 'e',
          appId: 'f',
        },
        flags: { isFirebaseConfigured: true },
      },
    }));
    vi.doMock('firebase/app', () => ({ initializeApp }));
    vi.doMock('firebase/auth', () => ({ getAuth }));
    vi.doMock('firebase/firestore', () => ({ getFirestore }));
    vi.doMock('firebase/storage', () => ({ getStorage }));

    const { getFirebaseAuth, getFirestoreDb, getFirebaseStorage } = await import('@services/firebaseConfig');

    expect(await getFirebaseAuth()).toEqual({ name: 'auth' });
    expect(await getFirestoreDb()).toEqual({ name: 'db' });
    expect(await getFirebaseStorage()).toEqual({ name: 'storage' });
    expect(initializeApp).toHaveBeenCalled();
  });
});
