import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from '../utils/loadTsModule.js';

const createService = (response) => loadTsModule('services/geminiService.ts', {
  fetch: async () => ({ ok: true, json: async () => ({ result: response }) }),
});

test('analyzeClinicalNote forwards structured payload', async () => {
  const mockResult = { structuredDiagnosis: 'Dx', extractedTasks: ['T1'] };
  const service = createService(mockResult);

  const result = await service.analyzeClinicalNote('nota');
  assert.deepEqual(result, mockResult);
});

test('analyzeClinicalNote surfaces errors cleanly', async () => {
  const failingService = loadTsModule('services/geminiService.ts', {
    fetch: async () => ({ ok: false, json: async () => ({ error: 'fail' }) }),
  });

  await assert.rejects(() => failingService.analyzeClinicalNote('nota'));
});
