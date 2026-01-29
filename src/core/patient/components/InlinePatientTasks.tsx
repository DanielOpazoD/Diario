import React from 'react';
import { Save, Square, X } from 'lucide-react';
import { PendingTask } from '@shared/types';

interface InlinePatientTasksProps {
  pendingTasks: PendingTask[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const InlinePatientTasks: React.FC<InlinePatientTasksProps> = ({
  pendingTasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
}) => (
  <div className="w-full min-w-0 overflow-hidden animate-fade-in space-y-2">
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 max-h-[300px]">
      {pendingTasks.length === 0 && (
        <p className="text-xs text-amber-600/60 text-center py-4 italic">No hay tareas pendientes</p>
      )}
      {pendingTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center group bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40 shadow-sm transition-all hover:border-amber-300"
        >
          <button
            onClick={() => onToggleTask(task.id)}
            className="mr-3 text-gray-400 hover:text-blue-500 transition-colors"
          >
            {task.isCompleted ? <Save className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-gray-300" />}
          </button>
          <span className={`text-xs flex-1 font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
            {task.text}
          </span>
          <button
            onClick={() => onDeleteTask(task.id)}
            className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
    <div className="mt-3">
      <input
        type="text"
        placeholder="+ Nueva tarea..."
        onKeyDown={onAddTask}
        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 rounded-lg border border-amber-200/50 focus:border-amber-400 outline-none shadow-sm placeholder:text-gray-400"
      />
    </div>
  </div>
);

export default InlinePatientTasks;
