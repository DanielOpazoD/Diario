import { emitStructuredLog, getSessionId } from '@services/logger';
import type { LogLevel } from '@services/logger';

export const logEvent = (
  level: LogLevel,
  source: string,
  message: string,
  details?: unknown,
) => emitStructuredLog(level, source, message, details);
export { getSessionId };
export type { LogLevel };
