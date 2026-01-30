import React, { useState } from 'react';
import { Save, Square, X, MessageSquare } from 'lucide-react';
import { PendingTask } from '@shared/types';

interface InlinePatientTasksProps {
  pendingTasks: PendingTask[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onUpdateTaskNote: (taskId: string, note: string) => void;
}

const InlinePatientTasks: React.FC<InlinePatientTasksProps> = ({
  pendingTasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onUpdateTaskNote,
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  return (
    <div className="w-full min-w-0 overflow-hidden animate-fade-in space-y-2">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 max-h-[300px]">
        {pendingTasks.length === 0 && (
          <p className="text-xs text-amber-600/60 text-center py-4 italic">No hay tareas pendientes</p>
        )}
        {pendingTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center group bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-blue-200"
          >
            <button
              onClick={() => onToggleTask(task.id)}
              className="mr-3 text-gray-400 hover:text-blue-500 transition-colors"
            >
              {task.isCompleted ? <Save className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-gray-300" />}
            </button>
            <div className="flex-1">
              <div className={`text-xs font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {task.text}
              </div>
              {task.isCompleted && (
                <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>
                    ({task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Completada'})
                  </span>
                  <button
                    className="text-[10px] text-blue-500 hover:text-blue-600"
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setNoteDraft(task.completionNote || '');
                    }}
                    title="Agregar nota"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {editingTaskId === task.id && (
                <div className="mt-1">
                  <input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onBlur={() => {
                      onUpdateTaskNote(task.id, noteDraft.trim());
                      setEditingTaskId(null);
                    }}
                    placeholder="Nota de confirmación..."
                    className="w-full px-2 py-1 text-[10px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              )}
              {task.completionNote && !editingTaskId && (
                <div className="text-[10px] text-gray-500 mt-0.5 italic">
                  {task.completionNote}
                </div>
              )}
            </div>
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
        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 rounded-lg border border-gray-200/60 focus:border-blue-400 outline-none shadow-sm placeholder:text-gray-400"
      />
      </div>
    </div>
  );
};

export default InlinePatientTasks;
