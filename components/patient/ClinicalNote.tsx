import React from 'react';
import { CheckSquare, Mic, Sparkles, Square, X, Paperclip, FileText } from 'lucide-react';
import { PendingTask } from '../../types';

interface ClinicalNoteProps {
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: PendingTask[];
  isListening: boolean;
  isAnalyzing: boolean;
  onDiagnosisChange: (value: string) => void;
  onClinicalNoteChange: (value: string) => void;
  onToggleListening: () => void;
  onAnalyze: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  activeTab: 'clinical' | 'files';
  onChangeTab: (tab: 'clinical' | 'files') => void;
  attachmentsCount: number;
}

const ClinicalNote: React.FC<ClinicalNoteProps> = ({
  diagnosis,
  clinicalNote,
  pendingTasks,
  isListening,
  isAnalyzing,
  onDiagnosisChange,
  onClinicalNoteChange,
  onToggleListening,
  onAnalyze,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  activeTab,
  onChangeTab,
  attachmentsCount,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 space-x-6 sticky top-0 bg-gray-50/30 dark:bg-gray-900/10 backdrop-blur-sm z-10 pt-2">
        <button
          onClick={() => onChangeTab('clinical')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative px-2 ${
            activeTab === 'clinical'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Clínica
          {activeTab === 'clinical' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
        </button>
        <button
          onClick={() => onChangeTab('files')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative px-2 ${
            activeTab === 'files'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          Adjuntos
          {attachmentsCount > 0 && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {attachmentsCount}
            </span>
          )}
          {activeTab === 'files' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
        </button>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Diagnóstico Principal</label>
        <input
          value={diagnosis}
          onChange={(e) => onDiagnosisChange(e.target.value)}
          placeholder="Ej. Neumonía Adquirida en la Comunidad, HTA descompensada..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
        />
      </div>

      {activeTab === 'clinical' ? (
        <div className="flex-1 flex flex-col animate-fade-in space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Evolución / Nota Clínica</label>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={onToggleListening}
                className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-full text-xs font-medium transition-all ${
                  isListening
                    ? 'bg-red-100 text-red-600 ring-2 ring-red-200 animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title="Dictar voz"
              >
                <Mic className="w-3.5 h-3.5" />
                {isListening ? 'Escuchando...' : 'Dictar'}
              </button>

              <button
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="flex-1 md:flex-none justify-center group flex items-center gap-1.5 px-4 py-2 md:py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-70"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    isAnalyzing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'
                  }`}
                />
                {isAnalyzing ? 'Analizando...' : 'Generar Plan IA'}
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-[200px] group">
            <textarea
              value={clinicalNote}
              onChange={(e) => onClinicalNoteChange(e.target.value)}
              placeholder="Escribe la evolución del paciente. Usa el botón de IA para extraer tareas automáticamente."
              className="w-full h-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner leading-relaxed font-medium text-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 min-h-[150px] flex flex-col">
            <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2 tracking-wider shrink-0">
              <CheckSquare className="w-3.5 h-3.5" /> Pendientes & Tareas
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center group bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-all"
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mr-3 text-gray-400 hover:text-blue-500 transition-colors p-1"
                  >
                    {task.isCompleted ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5" />}
                  </button>
                  <span
                    className={`text-sm flex-1 font-medium ${
                      task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="md:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative mt-3 shrink-0">
              <input
                type="text"
                placeholder="+ Escribe tarea y presiona Enter..."
                onKeyDown={onAddTask}
                className="w-full px-3 py-3 md:py-2 text-sm bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-amber-200 focus:border-amber-400 outline-none shadow-sm placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ClinicalNote;
