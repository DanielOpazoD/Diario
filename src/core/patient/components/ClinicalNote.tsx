import React, { useId } from 'react';
import { CheckSquare, Mic, Sparkles, Square, X, Paperclip, FileText } from 'lucide-react';
import { PendingTask } from '@shared/types';

interface ClinicalNoteProps {
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: PendingTask[];
  isListening: boolean;
  isAnalyzing: boolean;
  isSummarizing?: boolean;
  onDiagnosisChange: (value: string) => void;
  onClinicalNoteChange: (value: string) => void;
  onToggleListening: () => void;
  onAnalyze: () => void;
  onSummary?: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  activeTab: 'clinical' | 'files';
  onChangeTab: (tab: 'clinical' | 'files') => void;
  attachmentsCount: number;
  attachmentsSection?: React.ReactNode;
  minimal?: boolean;
}

const ClinicalNote: React.FC<ClinicalNoteProps> = ({
  diagnosis,
  clinicalNote,
  pendingTasks,
  isListening,
  isAnalyzing,
  isSummarizing,
  onDiagnosisChange,
  onClinicalNoteChange,
  onToggleListening,
  onAnalyze,
  onSummary,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  activeTab,
  onChangeTab,
  attachmentsCount,
  attachmentsSection,
  minimal = false,
}) => {
  const diagnosisId = useId();
  const noteId = useId();
  const addTaskId = useId();

  return (
    <div className={`w-full min-w-0 overflow-hidden flex flex-col ${activeTab === 'clinical' ? 'h-full' : 'h-auto'} gap-2`}>
      {!minimal && (
        <div
          className="flex border-b border-gray-200 dark:border-gray-700 mb-0.5 space-x-4 sticky top-0 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md z-10 pt-1 px-1"
          role="tablist"
          aria-label="Secciones de la ficha"
        >
          <button
            onClick={() => onChangeTab('clinical')}
            role="tab"
            type="button"
            aria-selected={activeTab === 'clinical'}
            className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition-all relative px-1 ${activeTab === 'clinical'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
          >
            <FileText className="w-3.5 h-3.5" /> Clínica
            {activeTab === 'clinical' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
          </button>
          <button
            onClick={() => onChangeTab('files')}
            role="tab"
            type="button"
            aria-selected={activeTab === 'files'}
            className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition-all relative px-1 ${activeTab === 'files'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Adjuntos
            {attachmentsCount > 0 && (
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] px-1.5 py-0.5 rounded-full">
                {attachmentsCount}
              </span>
            )}
            {activeTab === 'files' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
          </button>
        </div>
      )}

      {activeTab === 'clinical' ? (
        <div className={`flex-1 flex flex-col animate-fade-in ${minimal ? 'space-y-2 p-0 border-0 shadow-none bg-transparent' : 'space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/60 dark:to-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm'}`}>
          <div className="mb-0.5">
            {!minimal && (
              <label htmlFor={diagnosisId} className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1 tracking-wide uppercase ml-1">
                Diagnóstico
              </label>
            )}
            <input
              id={diagnosisId}
              value={diagnosis}
              onChange={(e) => onDiagnosisChange(e.target.value)}
              placeholder="Diagnóstico principal..."
              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-sm focus:border-gray-400 dark:focus:border-gray-500 outline-none shadow-sm font-semibold text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            {!minimal && <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase ml-1">Evolución / Nota Clínica</label>}

            {!minimal && (
              <div className="flex gap-1.5 w-full md:w-auto">
                <button
                  onClick={onToggleListening}
                  className={`flex-1 md:flex-none justify-center flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black transition-all uppercase ${isListening
                    ? 'bg-red-100 text-red-600 ring-2 ring-red-200 animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  title="Dictar voz"
                >
                  <Mic className="w-3 h-3" />
                  {isListening ? 'S' : 'Dictar'}
                </button>

                <button
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 md:flex-none justify-center group flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white rounded-full text-[10px] font-black transition-all shadow-lg shadow-violet-500/20 disabled:opacity-70 uppercase"
                  title="Generar diagnóstico y tareas"
                >
                  <Sparkles
                    className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'
                      }`}
                  />
                  {isAnalyzing ? 'Analizando...' : 'Plan IA'}
                </button>

                <button
                  onClick={onSummary}
                  disabled={isSummarizing}
                  className="flex-1 md:flex-none justify-center group flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-full text-[10px] font-black transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 uppercase"
                  title="Resumir nota clínica"
                >
                  <FileText
                    className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'
                      }`}
                  />
                  {isSummarizing ? 'Espera...' : 'Resumen IA'}
                </button>
              </div>
            )}
          </div>

          <textarea
            id={noteId}
            value={clinicalNote}
            onChange={(e) => onClinicalNoteChange(e.target.value)}
            placeholder="Escribe la evolución del paciente..."
            className={`w-full h-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-sm focus:border-gray-400 dark:focus:border-gray-500 outline-none resize-none shadow-inner leading-normal font-medium text-gray-700 dark:text-gray-200 ${minimal ? 'min-h-[100px]' : 'min-h-[140px]'}`}
          />

          <div className={`${minimal ? 'mt-2' : 'bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30'} flex flex-col transition-all`}>
            <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-1.5 tracking-wider shrink-0 ml-0.5">
              <CheckSquare className="w-3 h-3" /> Tareas Pendientes
              {minimal && pendingTasks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-[9px]">
                  {pendingTasks.length}
                </span>
              )}
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center group bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-all"
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mr-2 text-gray-400 hover:text-blue-500 transition-colors p-0.5"
                    aria-pressed={task.isCompleted}
                    aria-label={task.isCompleted ? 'Marcar tarea como pendiente' : 'Marcar tarea como completada'}
                  >
                    {task.isCompleted ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                  </button>
                  <span
                    className={`text-xs flex-1 font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'
                      }`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="md:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
                    aria-label="Eliminar tarea"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative mt-2 shrink-0">
              <input
                type="text"
                id={addTaskId}
                placeholder="+ Nueva tarea..."
                onKeyDown={onAddTask}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-amber-200 focus:border-amber-400 outline-none shadow-sm placeholder-gray-400 font-medium"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-3">
          {attachmentsSection ? (
            attachmentsSection
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800">
              No hay adjuntos disponibles para este paciente.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalNote;
