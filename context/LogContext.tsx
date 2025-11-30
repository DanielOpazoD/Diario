import React, { createContext, useContext, useState, useCallback } from 'react';
import { LogEntry, LogPayload } from '../types';

interface LogContextType {
  logs: LogEntry[];
  addLog: (payload: LogPayload) => void;
  clearLogs: () => void;
}

export const LogContext = createContext<LogContextType | undefined>(undefined);

const serializeError = (error: unknown) => {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: JSON.stringify(error) };
};

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((payload: LogPayload) => {
    const { level, source, message, context, error } = payload;
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      source,
      message,
      context,
      error: serializeError(error)
    };

    // Keep only last 50 logs to avoid memory issues
    setLogs(prev => [newLog, ...prev].slice(0, 50));

    // Also log to browser console with structured payload
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
    const consolePayload: Record<string, unknown> = {
      timestamp: new Date(newLog.timestamp).toISOString(),
      level: newLog.level,
      source: newLog.source,
      message: newLog.message,
      context: newLog.context,
      error: newLog.error,
    };

    logFn(`[${newLog.source}] ${newLog.message}`, consolePayload);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogger = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogger must be used within a LogProvider');
  }
  return context;
};