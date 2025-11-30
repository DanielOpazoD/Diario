import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from '../utils/loadTsModule.js';
import { createMemoryStorage, createDom } from '../utils/setupDom.js';

const createFetchMock = () => {
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });

    if (String(url).includes('upload/drive/v3/files')) {
      return { json: async () => ({ id: 'file-123', name: 'backup.json' }) };
    }

    if (options.method === 'POST') {
      return { json: async () => ({ id: 'folder-123' }) };
    }

    return { json: async () => ({ files: [] }) };
  };

  return { fetch, calls };
};

test('uploadFileToDrive creates folder and uploads JSON backup', async () => {
  createDom();
  const { fetch, calls } = createFetchMock();
  globalThis.localStorage = createMemoryStorage();
  globalThis.sessionStorage = createMemoryStorage();
  const googleService = loadTsModule('services/googleService.ts', { fetch });

  const result = await googleService.uploadFileToDrive('{}', 'backup.json', 'token-1', 'Respaldos');

  assert.equal(result.id, 'file-123');
  assert.ok(calls.some((c) => c.url.includes('upload/drive/v3/files')));
  const folderCreation = calls.filter((c) => c.options.method === 'POST' && c.url.endsWith('drive/v3/files'));
  assert.equal(folderCreation.length >= 1, true);
});
