import { PatientRecord } from '@shared/types';
import { firebasePatientSyncAdapter } from '@data/adapters/firebasePatientSyncAdapter';
import { logEvent } from '@use-cases/logger';

export const subscribeToPatients = (callback: (patients: PatientRecord[]) => void) =>
  firebasePatientSyncAdapter.subscribeToPatients(callback);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const NON_RETRYABLE_SYNC_PATTERNS = [
  /permission-denied/i,
  /unauthenticated/i,
  /invalid-argument/i,
  /forbidden/i,
  /insufficient permission/i,
];

const isNonRetryableSyncError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return NON_RETRYABLE_SYNC_PATTERNS.some((pattern) => pattern.test(message));
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, operation: string) => {
  if (timeoutMs <= 0) return promise;

  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

export const syncPatientsWithRetry = async (
  patients: PatientRecord[],
  maxAttempts = 3,
  baseDelayMs = 500,
  attemptTimeoutMs = 8000,
) => {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('maxAttempts must be an integer greater than 0');
  }
  if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0) {
    throw new Error('baseDelayMs must be a non-negative number');
  }
  if (!Number.isFinite(attemptTimeoutMs) || attemptTimeoutMs < 0) {
    throw new Error('attemptTimeoutMs must be a non-negative number');
  }
  if (!Array.isArray(patients) || patients.length === 0) {
    return;
  }

  let attempt = 0;
  let lastError: unknown;
  while (attempt < maxAttempts) {
    try {
      await withTimeout(
        firebasePatientSyncAdapter.syncPatients(patients),
        attemptTimeoutMs,
        'syncPatients'
      );
      return;
    } catch (error) {
      lastError = error;
      attempt += 1;
      const nonRetryable = isNonRetryableSyncError(error);
      logEvent('warn', 'PatientSync', 'Sync attempt failed', {
        attempt,
        maxAttempts,
        patientCount: patients.length,
        nonRetryable,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt >= maxAttempts || nonRetryable) break;
      const backoff = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 100);
      await sleep(backoff + jitter);
    }
  }
  logEvent('error', 'PatientSync', 'Sync retries exhausted', {
    attempts: maxAttempts,
    patientCount: patients.length,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
  throw lastError;
};
