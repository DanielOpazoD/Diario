import React, { useId } from 'react';
import { Mic, Sparkles, Paperclip, FileText } from 'lucide-react';
import { PendingTask } from '@shared/types';
import PendingTasksPanel from '@core/patient/components/PendingTasksPanel';

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
  onUpdateTaskNote: (taskId: string, note: string) => void;
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
  onUpdateTaskNote,
  activeTab,
  onChangeTab,
  attachmentsCount,
  attachmentsSection,
  minimal = false,
}) => {
  const diagnosisId = useId();
  const noteId = useId();

  return (
    <div className={`w-full min-w-0 overflow-hidden flex flex-col ${activeTab === 'clinical' ? 'h-full' : 'h-auto'} gap-2`}>
      {!minimal && (
        <div
          className="flex p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl mx-1 mb-2 gap-1 border border-gray-200/50 dark:border-gray-700/50"
          role="tablist"
          aria-label="Secciones de la ficha"
        >
          <button
            onClick={() => onChangeTab('clinical')}
            role="tab"
            type="button"
            aria-selected={activeTab === 'clinical'}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl ${activeTab === 'clinical'
              ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-premium-sm ring-1 ring-black/5'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
          >
            <FileText className="w-3.5 h-3.5" /> Clí­nica
          </button>
          <button
            onClick={() => onChangeTab('files')}
            role="tab"
            type="button"
            aria-selected={activeTab === 'files'}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl ${activeTab === 'files'
              ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-premium-sm ring-1 ring-black/5'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Adjuntos
            {attachmentsCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === 'files' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                {attachmentsCount}
              </span>
            )}
          </button>
        </div>
      )}

      {activeTab === 'clinical' ? (
        <div className={`flex-1 flex flex-col animate-fade-in ${minimal ? 'space-y-3 p-0 border-0 shadow-none bg-transparent' : 'space-y-4 glass-card p-5 rounded-panel shadow-premium border-white/20'}`}>
          <div className="mb-0.5">
            {!minimal && (
              <label htmlFor={diagnosisId} className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 tracking-[0.2em] uppercase ml-1">
                Diagnóstico
              </label>
            )}
            <input
              id={diagnosisId}
              value={diagnosis}
              onChange={(e) => onDiagnosisChange(e.target.value)}
              placeholder="Diagnóóstico principal..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50 text-sm focus:border-brand-400 dark:focus:border-brand-500 outline-none shadow-premium-sm font-bold text-gray-800 dark:text-gray-100 transition-all focus:ring-4 focus:ring-brand-500/5 placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            {!minimal && <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Nota Clínica</label>}

            {!minimal && (
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={onToggleListening}
                  className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-[10px] font-black transition-all duration-300 uppercase tracking-wider shadow-premium-sm transform active:scale-95 ${isListening
                    ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse ring-4 ring-red-500/10'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-500 border border-gray-100 dark:border-gray-700'
                    }`}
                  title="Dictar voz"
                >
                  <Mic className="w-3.5 h-3.5" />
                  {isListening ? 'S' : 'Dictar'}
                </button>

                <button
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                  className={`flex-1 md:flex-none justify-center group flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-[10px] font-black transition-all duration-300 uppercase tracking-wider transform active:scale-95 disabled:opacity-50 ${isAnalyzing
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105'}`}
                  title="Generar diagnóstico y tareas"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : 'group-hover:rotate-12'}`}
                  />
                  {isAnalyzing ? '...' : 'Plan IA'}
                </button>

                {onSummary && (
                  <button
                    onClick={onSummary}
                    disabled={isSummarizing}
                    className={`flex-1 md:flex-none justify-center group flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-[10px] font-black transition-all duration-300 uppercase tracking-wider transform active:scale-95 disabled:opacity-50 ${isSummarizing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      : 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105'}`}
                    title="Resumir nota clínica"
                  >
                    <FileText
                      className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : 'group-hover:rotate-12'}`}
                    />
                    {isSummarizing ? '...' : 'Resumen IA'}
                  </button>
                )}
              </div>
            )}
          </div>

          <textarea
            id={noteId}
            value={clinicalNote}
            onChange={(e) => onClinicalNoteChange(e.target.value)}
            placeholder="Escribe la evolución del paciente..."
            className={`w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50 text-sm focus:border-brand-400 dark:focus:border-brand-500 outline-none resize-none shadow-premium-sm transition-all focus:ring-4 focus:ring-brand-500/5 leading-relaxed font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 ${minimal ? 'min-h-[120px]' : 'min-h-[160px]'}`}
          />

          <PendingTasksPanel
            pendingTasks={pendingTasks}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onAddTask={onAddTask}
            onUpdateTaskNote={onUpdateTaskNote}
            minimal={minimal}
          />
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
