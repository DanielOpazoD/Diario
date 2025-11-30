import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from '../utils/loadTsModule.js';

const buildFetch = (ok, body) => async () => ({
  ok,
  json: async () => body,
});

test('analyzeClinicalNote forwards note text to Gemini function', async () => {
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ result: { structuredDiagnosis: 'Dx', extractedTasks: [] } }) };
  };
  const geminiService = loadTsModule('services/geminiService.ts', { fetch });

  const response = await geminiService.analyzeClinicalNote('nota de prueba');
  assert.equal(response.structuredDiagnosis, 'Dx');
  assert.equal(calls[0].noteText, 'nota de prueba');
});

test('analyzeClinicalNote throws user-friendly error when backend fails', async () => {
  const fetch = buildFetch(false, { error: 'Backend unavailable' });
  const geminiService = loadTsModule('services/geminiService.ts', { fetch });

  await assert.rejects(() => geminiService.analyzeClinicalNote('nota'), /Error al analizar la nota clínica/);
});
