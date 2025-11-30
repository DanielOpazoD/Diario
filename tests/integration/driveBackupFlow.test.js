import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from '../utils/loadTsModule.js';

test('uploadFileToDrive sends metadata and file content', async () => {
  const appended = [];
  class FakeFormData {
    append(key, value) { appended.push({ key, value }); }
  }
  class FakeHeaders {
    constructor(init) { this.init = init; }
  }

  const calls = [];
  const fetchMock = async (url, options = {}) => {
    calls.push({ url, options });
    return { json: async () => ({ ok: true }) };
  };

  const service = loadTsModule('services/googleService.ts', {
    FormData: FakeFormData,
    Headers: FakeHeaders,
    fetch: fetchMock,
    Blob: globalThis.Blob,
  });

  await service.uploadFileToDrive('{"data":true}', 'backup.json', 'token-123', 'MediDiario', 'folder-1');

  assert.equal(calls[0].url.includes('upload/drive'), true);
  assert.equal(appended.length, 2);
  const metadataEntry = appended.find((e) => e.key === 'metadata');
  assert.ok(metadataEntry);
});
