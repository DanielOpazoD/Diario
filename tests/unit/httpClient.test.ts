import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '@services/httpClient';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns on first successful response', async () => {
    const response = { status: 200 } as Response;
    (fetch as any).mockResolvedValueOnce(response);

    const result = await fetchWithRetry('http://example.com');
    expect(result).toBe(response);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable status and eventually returns', async () => {
    const response500 = { status: 500 } as Response;
    const response200 = { status: 200 } as Response;
    (fetch as any).mockResolvedValueOnce(response500).mockResolvedValueOnce(response200);

    const promise = fetchWithRetry('http://example.com', undefined, { retries: 1, backoffMs: 10 });
    await vi.advanceTimersByTimeAsync(20);

    const result = await promise;
    expect(result).toBe(response200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns last response after retries are exhausted', async () => {
    const response500 = { status: 500 } as Response;
    (fetch as any).mockResolvedValue(response500);

    const promise = fetchWithRetry('http://example.com', undefined, { retries: 1, backoffMs: 5 });
    await vi.advanceTimersByTimeAsync(20);

    await expect(promise).resolves.toBe(response500);
  });

  it('throws after network errors exhaust retries', async () => {
    (fetch as any).mockRejectedValue(new Error('network'));

    const promise = fetchWithRetry('http://example.com', undefined, { retries: 1, backoffMs: 5 });
    promise.catch(() => undefined);
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow('network');
  });

  it('aborts when timeout is reached', async () => {
    (fetch as any).mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason || new Error('aborted'));
        });
      });
    });

    const promise = fetchWithRetry('http://example.com', undefined, { retries: 0, timeoutMs: 10 });
    promise.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(20);
    await expect(promise).rejects.toThrow('Request timeout');
  });

  it('propagates external abort signals', async () => {
    (fetch as any).mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason || new Error('aborted'));
        });
      });
    });

    const controller = new AbortController();
    const promise = fetchWithRetry('http://example.com', { signal: controller.signal }, { retries: 0, timeoutMs: 100 });
    controller.abort(new Error('manual'));
    await expect(promise).rejects.toThrow('manual');
  });
});
