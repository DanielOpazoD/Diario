import React, { createContext, useContext, useState, useCallback } from 'react';
import { LogEntry } from '../types';
import { emitStructuredLog, getSessionId, LogLevel } from '../services/logger';

interface LogContextType {
  logs: LogEntry[];
  addLog: (level: LogLevel, source: string, message: string, details?: any) => void;
  clearLogs: () => void;
}

export const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: LogLevel, source: string, message: string, details?: any) => {
    const structured = emitStructuredLog(level, source, message, details);

    const newLog: LogEntry = {
      ...structured,
      sessionId: getSessionId(),
    };

    setLogs(prev => [newLog, ...prev].slice(0, 100));
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
