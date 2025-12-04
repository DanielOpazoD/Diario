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

test('formatTitleCase capitalizes each word', () => {
  const localStorage = new MemoryStorage();
  const mockStore = { patientTypes: [] };
  const { formatTitleCase } = loadTsModule('components/PatientModal.tsx', {
    localStorage,
    window: {},
    require: (id) => {
      if (id.endsWith('/Button') || id === './Button') return () => null;
      if (id.endsWith('/FileAttachmentManager') || id === './FileAttachmentManager') return () => null;
      if (id.includes('patient/PatientForm')) return () => null;
      if (id.includes('patient/ClinicalNote')) return () => null;
      if (id.includes('services/geminiService')) {
        return {
          analyzeClinicalNote: async () => ({ structuredDiagnosis: '', extractedTasks: [] }),
          extractPatientDataFromImage: async () => null,
          extractMultiplePatientsFromImage: async () => [],
        };
      }
      if (id.includes('services/googleService')) {
        return { downloadFileAsBase64: async () => '' };
      }
      if (id.includes('services/storage')) return { fileToBase64: async () => '' };
      if (id.includes('useAppStore')) return (selector) => selector(mockStore);
      return require(id);
    },
  });

  assert.equal(formatTitleCase('juan pérez'), 'Juan Pérez');
  assert.equal(formatTitleCase('MARIA lopez'), 'Maria Lopez');
});
