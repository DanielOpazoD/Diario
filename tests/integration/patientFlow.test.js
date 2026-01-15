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

test('patient records persist through storage helpers', () => {
  globalThis.localStorage = new MemoryStorage();

  const { createPatientSlice } = loadTsModule('stores/slices/patientSlice.ts');
  const { saveRecordsToLocal, loadRecordsFromLocal } = loadTsModule('services/storage.ts', {
    localStorage: globalThis.localStorage,
  });

  const store = create()((set, get, api) => ({ ...createPatientSlice(set, get, api) }));
  const patient = {
    id: 'p1',
    name: 'Nuevo Paciente',
    rut: '123',
    diagnosis: '',
    clinicalNote: '',
    pendingTasks: [],
    attachedFiles: [],
    date: '2024-02-01',
    createdAt: Date.now(),
    type: 'Turno',
  };

  store.getState().addPatient(patient);
  saveRecordsToLocal(store.getState().records);

  const reloaded = loadRecordsFromLocal();
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0].name, 'Nuevo Paciente');
});
