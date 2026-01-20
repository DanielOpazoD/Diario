export interface RetryOptions {
  retries?: number;
  backoffMs?: number;
  retryOnStatuses?: number[];
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  { retries = 3, backoffMs = 300, retryOnStatuses = [429, 500, 502, 503, 504] }: RetryOptions = {}
): Promise<Response> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const response = await fetch(input, init);

      if (!retryOnStatuses.includes(response.status) || attempt === retries) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    }

    const delay = backoffMs * Math.pow(2, attempt);
    await wait(delay);
    attempt += 1;
  }

  throw lastError instanceof Error ? lastError : new Error('Fetch failed after retries');
};
