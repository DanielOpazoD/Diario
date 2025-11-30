import test from 'node:test';
import assert from 'node:assert/strict';
import { create } from 'zustand';
import { loadTsModule } from '../utils/loadTsModule.js';

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
}

test('end-to-end: analyze note then save backup payload', async () => {
  globalThis.localStorage = new MemoryStorage();
  const gemini = loadTsModule('services/geminiService.ts', {
    fetch: async () => ({ ok: true, json: async () => ({ result: { structuredDiagnosis: 'IA', extractedTasks: ['Revisar'] } }) }),
  });

  const { createPatientSlice } = loadTsModule('stores/slices/patientSlice.ts');
  const { saveRecordsToLocal } = loadTsModule('services/storage.ts', { localStorage: globalThis.localStorage });
  const { uploadFileToDrive } = loadTsModule('services/googleService.ts', {
    fetch: async () => ({ json: async () => ({ ok: true }) }),
    FormData: class { append() {} },
    Headers: class {},
    Blob: globalThis.Blob,
  });

  const store = create()((set, get, api) => ({ ...createPatientSlice(set, get, api) }));
  const aiResult = await gemini.analyzeClinicalNote('nota completa');

  const patient = {
    id: 'p-e2e',
    name: 'Paciente Demo',
    rut: '99-9',
    diagnosis: aiResult.structuredDiagnosis,
    clinicalNote: 'nota completa',
    pendingTasks: aiResult.extractedTasks.map((text, idx) => ({ id: String(idx), text, isCompleted: false })),
    attachedFiles: [],
    date: '2024-03-01',
    createdAt: Date.now(),
    type: 'Turno',
  };

  store.getState().addPatient(patient);
  saveRecordsToLocal(store.getState().records);

  const uploadResult = await uploadFileToDrive(JSON.stringify(store.getState().records), 'backup.json', 'token', 'MediDiario', 'folder');

  assert.equal(store.getState().records[0].diagnosis, 'IA');
  assert.deepEqual(store.getState().records[0].pendingTasks[0].text, 'Revisar');
  assert.ok(uploadResult.ok !== undefined);
});
