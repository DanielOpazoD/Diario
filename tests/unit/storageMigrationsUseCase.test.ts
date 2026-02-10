import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadRecordsFromLocal: vi.fn(),
  saveRecordsToLocal: vi.fn(),
  loadGeneralTasksFromLocal: vi.fn(),
  saveGeneralTasksToLocal: vi.fn(),
  loadBookmarksFromLocal: vi.fn(),
  saveBookmarksToLocal: vi.fn(),
  loadBookmarkCategoriesFromLocal: vi.fn(),
  saveBookmarkCategoriesToLocal: vi.fn(),
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn(),
  setPatientRecords: vi.fn((records) => records),
}));

vi.mock('@use-cases/storage', () => ({
  loadRecordsFromLocal: mocks.loadRecordsFromLocal,
  saveRecordsToLocal: mocks.saveRecordsToLocal,
  loadGeneralTasksFromLocal: mocks.loadGeneralTasksFromLocal,
  saveGeneralTasksToLocal: mocks.saveGeneralTasksToLocal,
  loadBookmarksFromLocal: mocks.loadBookmarksFromLocal,
  saveBookmarksToLocal: mocks.saveBookmarksToLocal,
  loadBookmarkCategoriesFromLocal: mocks.loadBookmarkCategoriesFromLocal,
  saveBookmarkCategoriesToLocal: mocks.saveBookmarkCategoriesToLocal,
}));

vi.mock('@shared/utils/safeStorage', () => ({
  safeGetItem: mocks.safeGetItem,
  safeSetItem: mocks.safeSetItem,
}));

vi.mock('@use-cases/patient/records', () => ({
  setPatientRecords: mocks.setPatientRecords,
}));

import { runStorageMigrations } from '@use-cases/storageMigrations';

describe('runStorageMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadRecordsFromLocal.mockReturnValue([{ id: 'p1' }]);
    mocks.loadGeneralTasksFromLocal.mockReturnValue([{ id: 't1' }]);
    mocks.loadBookmarksFromLocal.mockReturnValue([{ id: 'b1' }]);
    mocks.loadBookmarkCategoriesFromLocal.mockReturnValue([{ id: 'c1' }]);
  });

  it('runs v2 and v3 migrations when version is missing', () => {
    mocks.safeGetItem.mockReturnValue(null);

    runStorageMigrations();

    expect(mocks.setPatientRecords).toHaveBeenCalledTimes(2);
    expect(mocks.saveRecordsToLocal).toHaveBeenCalledTimes(2);
    expect(mocks.saveGeneralTasksToLocal).toHaveBeenCalledWith([{ id: 't1' }]);
    expect(mocks.saveBookmarksToLocal).toHaveBeenCalledWith([{ id: 'b1' }]);
    expect(mocks.saveBookmarkCategoriesToLocal).toHaveBeenCalledWith([{ id: 'c1' }]);
    expect(mocks.safeSetItem).toHaveBeenCalledWith('medidiario_data_version', '3');
  });

  it('skips migrations when already at current version', () => {
    mocks.safeGetItem.mockReturnValue('3');

    runStorageMigrations();

    expect(mocks.saveRecordsToLocal).not.toHaveBeenCalled();
    expect(mocks.saveGeneralTasksToLocal).not.toHaveBeenCalled();
    expect(mocks.safeSetItem).not.toHaveBeenCalled();
  });

  it('does not downgrade unknown future versions', () => {
    mocks.safeGetItem.mockReturnValue('99');

    runStorageMigrations();

    expect(mocks.saveRecordsToLocal).not.toHaveBeenCalled();
    expect(mocks.saveGeneralTasksToLocal).not.toHaveBeenCalled();
    expect(mocks.safeSetItem).not.toHaveBeenCalled();
  });
});
