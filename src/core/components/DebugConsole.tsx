import React, { useState } from 'react';
import { Bug, Copy, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLogger } from '@core/context/LogContext';
import { format } from 'date-fns';
import { Button } from '@core/ui';

const DebugConsole: React.FC = () => {
  const { logs, clearLogs, addLog } = useLogger();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const copyToClipboard = () => {
    const logText = logs.map(l =>
      `[${format(l.timestamp, 'HH:mm:ss')}] [${l.level.toUpperCase()}] [${l.source}]: ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`
    ).join('\n');

    navigator.clipboard.writeText(logText);
    addLog('info', 'DebugConsole', 'Logs copiados al portapapeles');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all border border-gray-700 opacity-50 hover:opacity-100"
        title="Abrir Consola de Errores"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed left-4 z-50 w-full max-w-2xl transition-all duration-300 ${isMinimized ? 'bottom-4 h-14' : 'bottom-4 h-96'}`}>
      <div className="flex flex-col h-full bg-gray-900 rounded-t-xl shadow-2xl border border-gray-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2 text-white">
            <Bug className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono font-bold">CONSOLA TÉCNICA / DEBUGGER</span>
            <span className="px-2 py-0.5 rounded bg-gray-700 text-[10px] text-gray-300">{logs.length} eventos</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-gray-700 rounded text-gray-400">
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-red-900/50 hover:text-red-400 rounded text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {!isMinimized && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={clearLogs} className="h-7 text-xs px-2 bg-gray-800 border-gray-700 text-gray-300">
                <Trash2 className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            </div>
            <Button variant="primary" size="sm" onClick={copyToClipboard} className="h-7 text-xs px-2 bg-blue-700 hover:bg-blue-600 border-none">
              <Copy className="w-3 h-3 mr-1" /> Copiar Reporte
            </Button>
          </div>
        )}

        {/* Logs Area */}
        {!isMinimized && (
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-black/50 custom-scrollbar">
            {logs.length === 0 && (
              <div className="text-gray-600 text-center py-10 italic">No hay registros de errores o eventos aún.</div>
            )}
            {logs.map(log => (
              <div key={log.id} className={`flex gap-2 p-2 rounded border-l-2 ${log.level === 'error' ? 'bg-red-900/10 border-red-500 text-red-200' :
                  log.level === 'warn' ? 'bg-yellow-900/10 border-yellow-500 text-yellow-200' :
                    'bg-blue-900/10 border-blue-500 text-blue-200'
                }`}>
                <div className="flex flex-col gap-1 min-w-[80px]">
                  <span className="opacity-50">{format(log.timestamp, 'HH:mm:ss')}</span>
                  <span className={`font-bold uppercase text-[10px] ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-blue-500'
                    }`}>{log.level}</span>
                </div>
                <div className="flex-1 break-all">
                  <p className="font-bold mb-0.5 text-[11px] text-gray-400">[{log.source}]</p>
                  <p>{log.message}</p>
                  {log.details && (
                    <pre className="mt-1 p-1 bg-black/30 rounded text-[10px] text-gray-400 overflow-x-auto whitespace-pre-wrap">
                      {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugConsole;