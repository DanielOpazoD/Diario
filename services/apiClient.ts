export interface RetryOptions {
  retries?: number;
  backoffMs?: number;
  retryOnStatuses?: number[];
  retryOnNetworkError?: boolean;
}

const defaultRetryStatuses = new Set([429, 500, 502, 503, 504]);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetryResponse = (response: Response, retryStatuses: Set<number>) => {
  return retryStatuses.has(response.status);
};

const shouldRetryError = (error: unknown, retryOnNetworkError: boolean) => {
  if (!retryOnNetworkError) return false;
  return error instanceof TypeError || (error as any)?.name === 'AbortError';
};

export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> => {
  const {
    retries = 2,
    backoffMs = 300,
    retryOnStatuses = Array.from(defaultRetryStatuses),
    retryOnNetworkError = true,
  } = options;

  const retryStatusesSet = new Set(retryOnStatuses);
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, init);
      if (!shouldRetryResponse(response, retryStatusesSet)) {
        return response;
      }
      lastError = new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      lastError = error;
      if (!shouldRetryError(error, retryOnNetworkError)) {
        throw error;
      }
    }

    if (attempt < retries) {
      const delayMs = backoffMs * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Request failed after retries');
};
