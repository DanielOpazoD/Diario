import { beforeEach, describe, expect, it, vi } from 'vitest';

const subscribeMock = vi.fn(() => vi.fn());
const getStateMock = vi.fn(() => ({
  syncStatus: 'idle',
  lastSyncAt: null,
  setSyncStatus: vi.fn(),
}));

vi.mock('@core/stores/useAppStore', () => ({
  default: {
    subscribe: subscribeMock,
    getState: getStateMock,
  },
}));

vi.mock('@use-cases/storage', () => ({
  saveRecordsToLocal: vi.fn(),
  saveGeneralTasksToLocal: vi.fn(),
  saveBookmarksToLocal: vi.fn(),
  saveBookmarkCategoriesToLocal: vi.fn(),
}));

vi.mock('@use-cases/patientSync', () => ({
  syncPatientsWithRetry: vi.fn(),
}));

vi.mock('@shared/utils/storageJson', () => ({
  saveJson: vi.fn(),
  removeJson: vi.fn(),
}));

vi.mock('@shared/utils/safeStorage', () => ({
  safeSetItem: vi.fn(),
}));

vi.mock('@use-cases/storageShadow', () => ({
  shadowWriteToIndexedDb: vi.fn(),
}));

describe('initPersistence', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@core/app/persistence');
    mod.resetPersistenceForTests();
  });

  it('is idempotent and subscribes only once until teardown', async () => {
    const mod = await import('@core/app/persistence');

    const teardownA = mod.initPersistence();
    const teardownB = mod.initPersistence();

    expect(subscribeMock).toHaveBeenCalledTimes(1);
    expect(teardownA).toBe(teardownB);
  });

  it('allows a fresh subscription after teardown', async () => {
    const mod = await import('@core/app/persistence');
    const unsub = vi.fn();
    subscribeMock.mockReturnValueOnce(unsub);

    const teardown = mod.initPersistence();
    teardown();
    mod.initPersistence();

    expect(unsub).toHaveBeenCalledTimes(1);
    expect(subscribeMock).toHaveBeenCalledTimes(2);
  });
});
