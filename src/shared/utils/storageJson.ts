import { safeGetItem, safeSetItem, safeRemoveItem } from '@shared/utils/safeStorage';
import { safeJsonParse } from '@shared/utils/json';

export const loadJson = <T>(key: string, fallback: T): T => {
  const raw = safeGetItem(key);
  return safeJsonParse<T>(raw, fallback);
};

export const loadJsonArray = <T>(key: string, fallback: T[] = []): T[] => {
  const raw = safeGetItem(key);
  const parsed = safeJsonParse<unknown>(raw, fallback);
  return Array.isArray(parsed) ? (parsed as T[]) : fallback;
};

export const saveJson = (key: string, value: unknown) => {
  return safeSetItem(key, JSON.stringify(value));
};

export const removeJson = (key: string) => {
  return safeRemoveItem(key);
};
