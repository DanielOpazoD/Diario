import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from './utils/loadTsModule.js';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const createStorageMocks = () => {
  const session = new MemoryStorage();
  const local = new MemoryStorage();
  globalThis.sessionStorage = session;
  globalThis.localStorage = local;
  return { session, local };
};

test('restoreStoredToken returns null when nothing is stored', () => {
  createStorageMocks();
  const service = loadTsModule('services/googleService.ts');

  assert.equal(service.restoreStoredToken(), null);
});

test('restoreStoredToken prioritizes active session tokens', () => {
  const { session } = createStorageMocks();
  session.setItem('google_access_token', 'session-token');
  const service = loadTsModule('services/googleService.ts');

  assert.equal(service.restoreStoredToken(), 'session-token');
});

test('restoreStoredToken ignores expired stored tokens', () => {
  const { local } = createStorageMocks();
  local.setItem('medidiario_google_token', JSON.stringify({
    accessToken: 'old-token',
    expiresAt: Date.now() - 1000,
    version: 'v2',
  }));
  const service = loadTsModule('services/googleService.ts');

  assert.equal(service.restoreStoredToken(), null);
  assert.equal(local.getItem('medidiario_google_token'), null);
});

test('restoreStoredToken copies valid stored tokens to session storage', () => {
  const { local, session } = createStorageMocks();
  local.setItem('medidiario_google_token', JSON.stringify({
    accessToken: 'fresh-token',
    expiresAt: Date.now() + 60_000,
    version: 'v2',
  }));
  const service = loadTsModule('services/googleService.ts');

  assert.equal(service.restoreStoredToken(), 'fresh-token');
  assert.equal(session.getItem('google_access_token'), 'fresh-token');
});

test('listFolderEntries retries on invalid value errors', async () => {
  createStorageMocks();
  let callCount = 0;
  const fetchMock = async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid Value' } }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ files: [{ id: '1' }] }),
    };
  };

  const service = loadTsModule('services/googleService.ts', { fetch: fetchMock });
  const result = await service.listFolderEntries('access-token');

  assert.equal(callCount >= 2, true);
  assert.deepEqual(result, { files: [{ id: '1' }] });
});

test('listFolderEntries surfaces non-retriable errors', async () => {
  createStorageMocks();
  const fetchMock = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: { message: 'Server unavailable' } }),
  });

  const service = loadTsModule('services/googleService.ts', { fetch: fetchMock });

  await assert.rejects(() => service.listFolderEntries('access-token'));
});
