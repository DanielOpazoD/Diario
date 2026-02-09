import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAppStorage,
  downloadDataAsJson,
  downloadUrlAsArrayBuffer,
  downloadUrlAsBase64,
  loadBookmarkCategoriesFromLocal,
  loadBookmarksFromLocal,
  loadGeneralTasksFromLocal,
  loadRecordsFromLocal,
  parseUploadedJson,
  saveBookmarksToLocal,
  saveBookmarkCategoriesToLocal,
  saveGeneralTasksToLocal,
  saveRecordsToLocal,
} from '@services/storage';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';

describe('storage service', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
    localStorageMock.clear();
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('saves and loads records with defaults', () => {
    saveRecordsToLocal([
      { id: '1', name: 'Ana', createdAt: 1 } as any,
    ]);
    const records = loadRecordsFromLocal();
    expect(records).toHaveLength(1);
    expect(records[0].attachedFiles).toEqual([]);
    expect(records[0].pendingTasks).toEqual([]);
  });

  it('drops invalid records during normalization', () => {
    localStorageMock.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([
      { id: '1', name: 'Ana', createdAt: 1 },
      { name: 'Missing id' },
    ]));
    const records = loadRecordsFromLocal();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('1');
  });

  it('saves and loads tasks, bookmarks, and categories', () => {
    saveGeneralTasksToLocal([{ id: 't1', title: 'Test' } as any]);
    saveBookmarksToLocal([{ id: 'b1', title: 'Bookmark', url: 'https://example.com' } as any]);
    saveBookmarkCategoriesToLocal([{ id: 'c1', name: 'Cat' } as any]);

    expect(loadGeneralTasksFromLocal()).toHaveLength(1);
    const bookmarks = loadBookmarksFromLocal();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].order).toBe(0);
    expect(loadBookmarkCategoriesFromLocal()).toHaveLength(1);
  });

  it('clears all storage keys', () => {
    clearAppStorage();
    Object.values(STORAGE_KEYS).forEach((key) => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
    });
  });

  it('parses uploaded json backups', async () => {
    const file = new File([
      JSON.stringify({ patients: [{ id: '1', name: 'Ana' }] }),
    ], 'backup.json', { type: 'application/json' });

    const data = await parseUploadedJson(file);
    expect(data.patients).toHaveLength(1);
  });

  it('drops invalid collections when parsing uploaded backup object', async () => {
    const file = new File([
      JSON.stringify({
        patients: [{ id: '1', name: 'Ana' }],
        generalTasks: [{ id: 't1', title: 'legacy task' }, { foo: 'bad' }],
        bookmarks: [
          { id: 'b1', title: 'Valid', url: 'https://example.com', createdAt: 1, order: 0 },
          { id: 'b2', title: 'Invalid URL', url: 'notaurl' },
        ],
        bookmarkCategories: [{ id: 'c1', name: 'General' }, { id: 'c2' }],
      }),
    ], 'backup.json', { type: 'application/json' });

    const data = await parseUploadedJson(file);
    expect(data.generalTasks).toHaveLength(1);
    expect(data.generalTasks[0].text).toBe('legacy task');
    expect(data.bookmarks).toHaveLength(1);
    expect(data.bookmarkCategories).toHaveLength(1);
  });

  it('downloads backup json', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    downloadDataAsJson({
      patients: [],
      generalTasks: [],
      patientTypes: [],
      bookmarks: [],
      bookmarkCategories: [],
    });

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it('downloads firebase url via proxy as base64', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ base64: 'aGVsbG8=', mimeType: 'text/plain' }),
    } as any);

    const base64 = await downloadUrlAsBase64('https://firebasestorage.googleapis.com/v0/b/test');
    expect(base64).toBe('aGVsbG8=');
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('downloads non-firebase url as base64', async () => {
    const blob = new Blob(['hi'], { type: 'text/plain' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      blob: async () => blob,
    } as any);

    const base64 = await downloadUrlAsBase64('https://example.com/file.txt');
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);
    fetchSpy.mockRestore();
  });

  it('downloads firebase url as array buffer', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ base64: 'aGVsbG8=', mimeType: 'text/plain' }),
    } as any);

    const buffer = await downloadUrlAsArrayBuffer('https://firebasestorage.googleapis.com/v0/b/test');
    expect(buffer.byteLength).toBeGreaterThan(0);
    fetchSpy.mockRestore();
  });

  it('downloads non-firebase url as array buffer', async () => {
    const buf = new ArrayBuffer(4);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => buf,
    } as any);

    const buffer = await downloadUrlAsArrayBuffer('https://example.com/file.bin');
    expect(buffer.byteLength).toBe(4);
    fetchSpy.mockRestore();
  });

  it('throws when download fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
    } as any);

    await expect(downloadUrlAsBase64('https://example.com/file.txt')).rejects.toThrow('Failed to download file content');
    fetchSpy.mockRestore();
  });
});
