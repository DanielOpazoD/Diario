import React, { createContext, useContext, useState, useCallback } from 'react';
import { LogEntry } from '../types';

interface LogContextType {
  logs: LogEntry[];
  addLog: (level: 'info' | 'warn' | 'error', source: string, message: string, details?: any) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: 'info' | 'warn' | 'error', source: string, message: string, details?: any) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      source,
      message,
      details
    };
    
    // Keep only last 50 logs to avoid memory issues
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    
    // Also log to browser console
    const style = level === 'error' ? 'color: red; font-weight: bold' : 'color: blue';
    console.log(`%c[${source}] ${message}`, style, details || '');
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