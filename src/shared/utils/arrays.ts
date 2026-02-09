export const ensureArray = <T>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

export const isNonEmptyArray = <T>(value: T[]): value is [T, ...T[]] =>
  Array.isArray(value) && value.length > 0;
