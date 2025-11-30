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

const { parseLocalYMD, calculateAge } = loadTsModule('features/patients/components/CompactPatientCard.tsx', {
  localStorage: new MemoryStorage(),
  window: { matchMedia: () => ({ matches: false }) },
  require: (id) => {
    if (id.includes('useAppStore')) return () => ({ patientTypes: [], highlightPendingPatients: false, updatePatient: () => {} });
    return require(id);
  },
});

test('parseLocalYMD converts yyyy-mm-dd strings to local dates', () => {
  const date = parseLocalYMD('2024-03-10');
  assert.equal(date.getFullYear(), 2024);
  assert.equal(date.getMonth(), 2);
  assert.equal(date.getDate(), 10);
});

test('calculateAge returns friendly strings and handles bad input', () => {
  const nowYear = new Date().getFullYear();
  const age = calculateAge(`${nowYear - 30}-01-01`);
  assert.match(age, /30\s+años/);
  assert.equal(calculateAge('not-a-date'), '');
});
