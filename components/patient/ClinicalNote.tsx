import React, { useId } from 'react';
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
  const diagnosisId = useId();
  const noteId = useId();
  const addTaskId = useId();
  const isClinicalTab = activeTab === 'clinical';

  return (
    <div className={`flex flex-col ${isClinicalTab ? 'h-full' : 'h-auto'} px-4 md:px-6 py-5 rounded-2xl bg-gradient-to-b from-white via-white to-blue-50/40 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800/40 border border-gray-100 dark:border-gray-700/80 shadow-inner shadow-blue-100/30`}> 
      <div
        className="flex border-b border-gray-200 dark:border-gray-700 mb-4 space-x-6 sticky top-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm z-10 pt-1"
        role="tablist"
        aria-label="Secciones de la ficha"
      >
        <button
          onClick={() => onChangeTab('clinical')}
          role="tab"
          type="button"
          aria-selected={activeTab === 'clinical'}
          className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative px-2 ${
            activeTab === 'clinical'
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Clínica
          {activeTab === 'clinical' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 rounded-t-full"></span>}
        </button>
        <button
          onClick={() => onChangeTab('files')}
          role="tab"
          type="button"
          aria-selected={activeTab === 'files'}
          className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative px-2 ${
            activeTab === 'files'
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          Adjuntos
          {attachmentsCount > 0 && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {attachmentsCount}
            </span>
          )}
          {activeTab === 'files' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 rounded-t-full"></span>}
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <label htmlFor={diagnosisId} className="block text-[11px] font-bold uppercase tracking-[0.08em] text-gray-600 dark:text-gray-300 mb-1">
              Diagnóstico Principal
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Usa un título claro para identificar el motivo de atención.</p>
          </div>
          <span className="px-3 py-1 text-[11px] rounded-full bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-200 border border-blue-100 dark:border-blue-800">Ficha Clínica</span>
        </div>
        <input
          id={diagnosisId}
          value={diagnosis}
          onChange={(e) => onDiagnosisChange(e.target.value)}
          placeholder="Ej. Neumonía adquirida, HTA descompensada, lumbalgia..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-900/60 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-semibold text-gray-800 dark:text-gray-100"
        />
      </div>

      {isClinicalTab ? (
        <div className="flex-1 flex flex-col animate-fade-in space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-600 dark:text-gray-300">Evolución / Nota Clínica</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Describe hallazgos, evolución y próximos pasos.</p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={onToggleListening}
                className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isListening
                    ? 'bg-red-50 text-red-600 ring-2 ring-red-200 animate-pulse shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 shadow-sm'
                }`}
                title="Dictar voz"
              >
                <Mic className="w-3.5 h-3.5" />
                {isListening ? 'Escuchando...' : 'Dictar'}
              </button>

              <button
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="flex-1 md:flex-none justify-center group flex items-center gap-1.5 px-4 py-2 md:py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-700 hover:via-indigo-700 hover:to-fuchsia-700 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
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

          <div className="relative flex-1 min-h-[260px] group">
            <textarea
              id={noteId}
              value={clinicalNote}
              onChange={(e) => onClinicalNoteChange(e.target.value)}
              placeholder="Escribe la evolución del paciente. Usa el botón de IA para extraer tareas automáticamente."
              className="w-full h-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner leading-relaxed font-medium text-gray-800 dark:text-gray-200"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30 min-h-[150px] flex flex-col shadow-sm">
            <h4 className="text-xs font-bold uppercase text-amber-700 dark:text-amber-500 mb-3 flex items-center gap-2 tracking-wider shrink-0">
              <CheckSquare className="w-3.5 h-3.5" /> Pendientes & Tareas
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center group bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-all"
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mr-3 text-gray-400 hover:text-blue-500 transition-colors p-1"
                    aria-pressed={task.isCompleted}
                    aria-label={task.isCompleted ? 'Marcar tarea como pendiente' : 'Marcar tarea como completada'}
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
                    aria-label="Eliminar tarea"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative mt-3 shrink-0">
              <input
                type="text"
                id={addTaskId}
                placeholder="+ Escribe tarea y presiona Enter..."
                onKeyDown={onAddTask}
                className="w-full px-3 py-3 md:py-2 text-sm bg-white dark:bg-gray-800 rounded-xl border border-transparent hover:border-amber-200 focus:border-amber-400 outline-none shadow-sm placeholder-gray-400"
              />
              <label htmlFor={addTaskId} className="sr-only">
                Agregar nueva tarea clínica
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
            <Paperclip className="w-4 h-4" />
            Gestiona los adjuntos en la sección inferior
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Arrastra archivos, consulta Drive o marca favoritos desde el panel de adjuntos sin perder de vista el diagnóstico.</p>
        </div>
      )}
    </div>
  );
};

export default ClinicalNote;
