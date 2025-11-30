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
  const localStorage = new MemoryStorage();
  const { validateTypeLabel } = loadTsModule('components/Settings.tsx', {
    localStorage,
    window: { matchMedia: () => ({ matches: false }) },
    require: (id) => {
      if (id.endsWith('/Button') || id === './Button') return () => null;
      if (id.includes('useAppStore')) {
        const mockState = {
          theme: 'light',
          toggleTheme: () => {},
          patientTypes: sampleTypes,
          addPatientType: () => {},
          removePatientType: () => {},
          setPatientTypes: () => {},
          records: [],
          setRecords: () => {},
          addToast: () => {},
          securityPin: null,
          autoLockMinutes: 5,
          setSecurityPin: () => {},
          setAutoLockMinutes: () => {},
          masterPasswordSalt: null,
          masterPasswordHash: null,
          setMasterPasswordData: () => {},
          setMasterUnlocked: () => {},
          setMasterKey: () => {},
          resetMasterPassword: () => {},
          highlightPendingPatients: false,
          setHighlightPendingPatients: () => {},
          compactStats: false,
          setCompactStats: () => {},
        };
        return (selector) => selector(mockState);
      }
      return require(id);
    },
  });

  assert.equal(validateTypeLabel('', sampleTypes), 'El nombre es requerido');
  assert.equal(validateTypeLabel('turno', sampleTypes), 'Ya existe un tipo con este nombre');
  assert.equal(validateTypeLabel('Domicilio', sampleTypes), null);
});

test('validateTypeLabel ignores current item when editing', () => {
  const localStorage = new MemoryStorage();
  const { validateTypeLabel } = loadTsModule('components/Settings.tsx', {
    localStorage,
    window: { matchMedia: () => ({ matches: false }) },
    require: (id) => {
      if (id.endsWith('/Button') || id === './Button') return () => null;
      if (id.includes('useAppStore')) {
        const mockState = {
          theme: 'light',
          toggleTheme: () => {},
          patientTypes: sampleTypes,
          addPatientType: () => {},
          removePatientType: () => {},
          setPatientTypes: () => {},
          records: [],
          setRecords: () => {},
          addToast: () => {},
          securityPin: null,
          autoLockMinutes: 5,
          setSecurityPin: () => {},
          setAutoLockMinutes: () => {},
          masterPasswordSalt: null,
          masterPasswordHash: null,
          setMasterPasswordData: () => {},
          setMasterUnlocked: () => {},
          setMasterKey: () => {},
          resetMasterPassword: () => {},
          highlightPendingPatients: false,
          setHighlightPendingPatients: () => {},
          compactStats: false,
          setCompactStats: () => {},
        };
        return (selector) => selector(mockState);
      }
      return require(id);
    },
  });

  assert.equal(validateTypeLabel('Turno', sampleTypes, '1'), null);
});
