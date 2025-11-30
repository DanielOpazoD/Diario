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

const sessionId = (() => {
  try {
    const existing = sessionStorage.getItem('medidiario_session_id');
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem('medidiario_session_id', created);
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
  const entry: StructuredLog = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    sessionId,
    level,
    source,
    message,
    details,
  };

  const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  consoleMethod(`[${source}] ${message}`, entry);

  return entry;
};

export const getSessionId = () => sessionId;
