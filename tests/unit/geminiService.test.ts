import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeClinicalNote,
  extractPatientDataFromText,
  validateEnvironment,
} from '@services/geminiService';

vi.mock('@services/httpClient', () => ({
  fetchWithRetry: vi.fn(),
}));

vi.mock('@services/logger', () => ({
  emitStructuredLog: vi.fn(),
}));

const mockResponse = (options: { ok: boolean; status: number; body: string }) =>
  ({
    ok: options.ok,
    status: options.status,
    text: vi.fn().mockResolvedValue(options.body),
  }) as unknown as Response;

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed result for successful responses', async () => {
    const { fetchWithRetry } = await import('@services/httpClient');
    const payload = {
      result: { structuredDiagnosis: 'dx', extractedTasks: [] },
    };
    (fetchWithRetry as any).mockResolvedValue(
      mockResponse({ ok: true, status: 200, body: JSON.stringify(payload) })
    );

    const result = await analyzeClinicalNote('nota');
    expect(result).toEqual(payload.result);
  });

  it('throws timeout message for non-json 504 responses', async () => {
    const { fetchWithRetry } = await import('@services/httpClient');
    (fetchWithRetry as any).mockResolvedValue(
      mockResponse({ ok: false, status: 504, body: '<html>timeout</html>' })
    );

    await expect(extractPatientDataFromText('texto')).rejects.toThrow(
      'Netlify Timeout'
    );
  });

  it('throws server-provided error message for error payloads', async () => {
    const { fetchWithRetry } = await import('@services/httpClient');
    (fetchWithRetry as any).mockResolvedValue(
      mockResponse({ ok: false, status: 400, body: JSON.stringify({ error: 'bad' }) })
    );

    await expect(extractPatientDataFromText('texto')).rejects.toThrow('bad');
  });

  it('returns Missing status when validateEnvironment fails', async () => {
    const { fetchWithRetry } = await import('@services/httpClient');
    (fetchWithRetry as any).mockRejectedValue(new Error('down'));

    const status = await validateEnvironment();
    expect(status.status).toBe('Missing');
  });
});
