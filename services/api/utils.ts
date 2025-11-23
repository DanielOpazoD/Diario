import { PaginationParams } from './types';

export const buildPaginationParams = (pagination?: PaginationParams) => {
  if (!pagination) return undefined;
  const { page = 1, pageSize = 20 } = pagination;
  return { page, pageSize };
};

export const withRetry = async <T>(fn: (signal?: AbortSignal) => Promise<T>, retries = 2, delayMs = 300, signal?: AbortSignal): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fn(signal);
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt > retries) break;
      await new Promise(res => setTimeout(res, delayMs * attempt));
    }
  }

  throw lastError;
};

export const createCancellableRequest = () => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
};
