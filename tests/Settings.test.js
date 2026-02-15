import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import { loadTsModule } from './utils/loadTsModule.js';

const require = createRequire(import.meta.url);
class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
}

const sampleTypes = [
  { id: '1', label: 'Turno', colorClass: 'bg-blue' },
  { id: '2', label: 'Hospitalizado', colorClass: 'bg-red' },
];

test('validateTypeLabel enforces required and duplicate rules', () => {
  const { validateTypeLabel } = loadTsModule('src/features/settings/PatientTypesSettings.tsx', {
    require: (id) => {
      if (id.endsWith('/Button') || id === './Button') return () => null;
      return require(id);
    },
  });

  assert.equal(validateTypeLabel('', sampleTypes), 'El nombre es requerido');
  assert.equal(validateTypeLabel('turno', sampleTypes), 'Ya existe un tipo con este nombre');
  assert.equal(validateTypeLabel('Domicilio', sampleTypes), null);
});

test('validateTypeLabel ignores current item when editing', () => {
  const { validateTypeLabel } = loadTsModule('src/features/settings/PatientTypesSettings.tsx', {
    require: (id) => {
      if (id.endsWith('/Button') || id === './Button') return () => null;
      return require(id);
    },
  });

  assert.equal(validateTypeLabel('Turno', sampleTypes, '1'), null);
});
