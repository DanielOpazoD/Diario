import React, { useId } from 'react';
import { CheckSquare, Square, X } from 'lucide-react';
import { PendingTask } from '@shared/types';

interface PendingTasksPanelProps {
  pendingTasks: PendingTask[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  minimal?: boolean;
}

const PendingTasksPanel: React.FC<PendingTasksPanelProps> = ({
  pendingTasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  minimal = false,
}) => {
  const addTaskId = useId();

  return (
    <div className={`${minimal ? 'mt-2' : 'glass-card p-4 rounded-2xl border-amber-500/10 bg-amber-50/10 dark:bg-amber-900/5'} flex flex-col transition-all duration-500 shadow-premium-sm`}>
      <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2 tracking-[0.2em] shrink-0 ml-0.5">
        <CheckSquare className="w-3.5 h-3.5" /> Tareas Pendientes
        {minimal && (pendingTasks?.length || 0) > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-[9px]">
            {pendingTasks.length}
          </span>
        )}
      </h4>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
        {(pendingTasks || []).map((task) => (
          <div
            key={task.id}
            className={`flex items-center group p-2.5 rounded-xl border transition-all duration-300 ${task.isCompleted ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800' : 'bg-white/80 dark:bg-gray-800/80 border-amber-100/50 dark:border-amber-900/30 shadow-premium-sm hover:shadow-premium'}`}
          >
            <button
              onClick={() => onToggleTask(task.id)}
              className={`mr-3 transition-all duration-300 transform hover:scale-110 ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-amber-500'}`}
              aria-pressed={task.isCompleted}
            >
              {task.isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </button>
            <span
              className={`text-xs flex-1 font-bold ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'
                }`}
            >
              {task.text}
            </span>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 transition-all duration-300 hover:scale-110"
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
          placeholder="+ Nueva tarea rápida..."
          onKeyDown={onAddTask}
          className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-gray-950/50 rounded-xl border border-transparent hover:border-amber-400/30 focus:border-amber-400/50 outline-none shadow-premium-sm placeholder-gray-400 font-bold transition-all focus:ring-4 focus:ring-amber-500/5"
        />
      </div>
    </div>
  );
};

export default PendingTasksPanel;
