import { safeSessionGetItem, safeSessionSetItem } from '@shared/utils/safeSessionStorage';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';
import { anonymizeIdentifier, sanitizeErrorForLog, sanitizeUrlForLog } from '@shared/utils/privacy';

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
const IDENTIFIER_KEYS = ['id', 'uid', 'patientId', 'fileId', 'recordId'];

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

const isIdentifierKey = (key: string) => {
  const normalized = key.toLowerCase();
  return IDENTIFIER_KEYS.some((candidate) => normalized === candidate.toLowerCase());
};

const normalizeStringValue = (value: string) => {
  const sanitized = sanitizeUrlForLog(value);
  if (sanitized.length <= 240) return sanitized;
  return `${sanitized.slice(0, 237)}...`;
};

const redactDetails = (details: unknown): unknown => {
  if (details instanceof Error) return sanitizeErrorForLog(details);
  if (typeof details === 'string') return normalizeStringValue(details);
  if (!details || typeof details !== 'object') return details;
  if (Array.isArray(details)) {
    return details.map((entry) => redactDetails(entry));
  }
  const result: Record<string, unknown> = {};
  Object.entries(details).forEach(([key, value]) => {
    if (key.toLowerCase() === 'error') {
      result[key] = sanitizeErrorForLog(value);
      return;
    }
    if (isIdentifierKey(key) && typeof value === 'string') {
      result[key] = anonymizeIdentifier(value, key);
      return;
    }
    if (isSensitiveKey(key)) {
      result[key] = redactValue(value);
    } else if (value && typeof value === 'object') {
      result[key] = redactDetails(value);
    } else if (typeof value === 'string') {
      result[key] = normalizeStringValue(value);
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
