import React from 'react';
import { CheckSquare, Plus, Square, Trash2 } from 'lucide-react';
import { GeneralTask } from '@shared/types';

interface QuickNotesPanelProps {
  generalTasks: GeneralTask[];
  newGeneralTask: string;
  onNewGeneralTaskChange: (value: string) => void;
  onNewGeneralTaskKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onToggleGeneralTask: (id: string) => void;
  onDeleteGeneralTask: (id: string) => void;
  quickAddRef: React.RefObject<HTMLInputElement>;
}

const QuickNotesPanel: React.FC<QuickNotesPanelProps> = ({
  generalTasks,
  newGeneralTask,
  onNewGeneralTaskChange,
  onNewGeneralTaskKeyDown,
  onToggleGeneralTask,
  onDeleteGeneralTask,
  quickAddRef,
}) => (
  <div className="glass-card rounded-panel border-none shadow-premium p-4 flex flex-col h-full overflow-hidden relative group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-3xl rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-brand-500/10 transition-colors duration-700"></div>

    <div className="flex items-center gap-2 mb-4 shrink-0">
      <div className="p-1.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-inner ring-1 ring-brand-500/10">
        <Plus className="w-3.5 h-3.5" />
      </div>
      <h3 className="text-[11px] font-black tracking-widest text-gray-900 dark:text-white uppercase leading-none">Notas Rápidas</h3>
    </div>

    <div className="relative mb-4 shrink-0">
      <input
        type="text"
        ref={quickAddRef}
        value={newGeneralTask}
        onChange={e => onNewGeneralTaskChange(e.target.value)}
        onKeyDown={onNewGeneralTaskKeyDown}
        placeholder="Anotar pendiente..."
        className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-[11px] font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:italic"
      />
      <Plus className="w-3.5 h-3.5 text-brand-500 absolute left-3 top-1/2 -translate-y-1/2" />
    </div>

    <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3">
      {generalTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-center opacity-30">
          <Plus className="w-7 h-7 mb-2" />
          <p className="text-[10px] font-black uppercase tracking-widest">Sin recordatorios</p>
        </div>
      )}
      {generalTasks.sort((a, b) => b.createdAt - a.createdAt).map(task => (
        <div key={task.id} className={`group flex items-start p-3 rounded-xl transition-all duration-300 border border-transparent ${task.isCompleted ? 'bg-gray-50/50 dark:bg-gray-900/30 opacity-60' : 'bg-white/40 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-brand-500/20 hover:shadow-premium-sm'}`}>
          <button
            onClick={() => onToggleGeneralTask(task.id)}
            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110 active:scale-90"
          >
            {task.isCompleted
              ? <div className="p-0.5 rounded-md bg-green-500/10 text-green-500"><CheckSquare className="w-3 h-3" /></div>
              : <div className="p-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-brand-500"><Square className="w-3 h-3" /></div>
            }
          </button>
          <span className={`ml-3 text-[10px] font-bold flex-1 leading-relaxed tracking-tight ${task.isCompleted ? 'line-through text-gray-400 italic' : 'text-gray-700 dark:text-gray-200'}`}>
            {task.text}
          </span>
          <button
            onClick={() => onDeleteGeneralTask(task.id)}
            className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default QuickNotesPanel;
