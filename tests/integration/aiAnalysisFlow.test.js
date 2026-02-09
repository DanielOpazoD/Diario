import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from '../utils/loadTsModule.js';

const createService = (response) => loadTsModule('services/geminiService.ts', {
  fetch: async () => ({
    ok: true,
    text: async () => JSON.stringify({ result: response }),
  }),
});

test('analyzeClinicalNote forwards structured payload', async () => {
  const mockResult = { structuredDiagnosis: 'Dx', extractedTasks: ['T1'] };
  const service = createService(mockResult);

  const result = await service.analyzeClinicalNote('nota');
  assert.equal(JSON.stringify(result), JSON.stringify(mockResult));
});

test('analyzeClinicalNote surfaces errors cleanly', async () => {
  const failingService = loadTsModule('services/geminiService.ts', {
    fetch: async () => ({
      ok: false,
      text: async () => JSON.stringify({ error: 'fail' }),
    }),
  });

  await assert.rejects(() => failingService.analyzeClinicalNote('nota'));
});
