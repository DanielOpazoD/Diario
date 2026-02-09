export interface RetryOptions {
  retries?: number;
  backoffMs?: number;
  retryOnStatuses?: number[];
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  { retries = 3, backoffMs = 300, retryOnStatuses = [429, 500, 502, 503, 504], timeoutMs }: RetryOptions = {}
): Promise<Response> => {
  let attempt = 0;
  let lastError: unknown;
  const fetchImpl = (globalThis as any).__fetchOverride ?? fetch;

  while (attempt <= retries) {
    const controller = new AbortController();
    const existingSignal = init?.signal;
    let abortListener: (() => void) | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    try {
      if (existingSignal) {
        if (existingSignal.aborted) {
          controller.abort(existingSignal.reason);
        } else {
          abortListener = () => controller.abort(existingSignal.reason);
          existingSignal.addEventListener('abort', abortListener, { once: true });
        }
      }

      if (timeoutMs && timeoutMs > 0) {
        timeout = setTimeout(() => controller.abort(new Error('Request timeout')), timeoutMs);
      }

      const response = await fetchImpl(input, { ...init, signal: controller.signal });

      if (!retryOnStatuses.includes(response.status) || attempt === retries) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    } finally {
      if (abortListener && existingSignal) {
        existingSignal.removeEventListener('abort', abortListener);
      }
      if (timeout) clearTimeout(timeout);
    }

    const delay = backoffMs * Math.pow(2, attempt);
    await wait(delay);
    attempt += 1;
  }

  throw lastError instanceof Error ? lastError : new Error('Fetch failed after retries');
};
