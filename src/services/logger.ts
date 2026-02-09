import { safeSessionGetItem, safeSessionSetItem } from '@shared/utils/safeSessionStorage';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';

export type LogLevel = 'info' | 'warn' | 'error';

export interface StructuredLog {
  id: string;
  timestamp: number;
  sessionId: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: any;
}

const SENSITIVE_KEYS = new Set([
  'name',
  'rut',
  'diagnosis',
  'clinicalNote',
  'patientName',
  'patient',
  'patientRecord',
  'record',
  'rawData',
  'notes',
  'clinicalNotes',
  'payload',
  'data',
]);

const SENSITIVE_SUBSTRINGS = ['name', 'rut', 'diagnosis', 'clinical', 'patient', 'note', 'record', 'raw'];

const isSensitiveKey = (key: string) => {
  if (SENSITIVE_KEYS.has(key)) return true;
  const normalized = key.toLowerCase();
  return SENSITIVE_SUBSTRINGS.some((part) => normalized.includes(part));
};

const redactValue = (value: unknown): unknown => {
  if (typeof value === 'string') return '[REDACTED]';
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') return {};
  return undefined;
};

const redactDetails = (details: unknown): unknown => {
  if (!details || typeof details !== 'object') return details;
  if (Array.isArray(details)) {
    return details.map((entry) => redactDetails(entry));
  }
  const result: Record<string, unknown> = {};
  Object.entries(details).forEach(([key, value]) => {
    if (isSensitiveKey(key)) {
      result[key] = redactValue(value);
    } else if (value && typeof value === 'object') {
      result[key] = redactDetails(value);
    } else {
      result[key] = value;
    }
  });
  return result;
};

const sessionId = (() => {
  try {
    const existing = safeSessionGetItem(SESSION_KEYS.SESSION_ID);
    if (existing) return existing;
    const created = crypto.randomUUID();
    safeSessionSetItem(SESSION_KEYS.SESSION_ID, created);
    return created;
  } catch (_) {
    return crypto.randomUUID();
  }
})();

export const emitStructuredLog = (
  level: LogLevel,
  source: string,
  message: string,
  details?: any
): StructuredLog => {
  const safeDetails = redactDetails(details);
  const entry: StructuredLog = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    sessionId,
    level,
    source,
    message,
    details: safeDetails,
  };

  const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  consoleMethod(`[${source}] ${message}`, entry);

  return entry;
};

export const getSessionId = () => sessionId;
