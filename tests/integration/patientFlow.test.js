import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom, createMemoryStorage } from '../utils/setupDom.js';
import { loadTsModule } from '../utils/loadTsModule.js';

const patient = {
  id: 'p-1',
  name: 'Paciente Uno',
  rut: '12.345.678-9',
  date: '2024-05-20',
  type: 'Turno',
  diagnosis: '',
  clinicalNote: '',
  pendingTasks: [],
};

test('app store adds and persists a patient record', (t) => {
  t.mock.timers.enable({ now: 0 });
  const dom = createDom();
  const memoryStorage = createMemoryStorage();
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = memoryStorage;
  globalThis.sessionStorage = memoryStorage;
  globalThis.crypto = globalThis.crypto || require('node:crypto').webcrypto;

  const storeModule = loadTsModule('stores/useAppStore.ts', {
    window: dom.window,
    document: dom.window.document,
    localStorage: memoryStorage,
    sessionStorage: memoryStorage,
  });
  const useAppStore = storeModule.default;

  useAppStore.getState().addPatient(patient);
  assert.equal(useAppStore.getState().records.length, 1);

  t.mock.timers.tick(2000);
  const persisted = memoryStorage.getItem('medidiario_data_v1');
  assert.ok(persisted, 'record should be written to storage');
});
