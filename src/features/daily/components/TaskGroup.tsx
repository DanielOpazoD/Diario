import React from 'react';
import { ArrowRight, CheckSquare, Square } from 'lucide-react';
import { PendingTask } from '@shared/types';

export interface EnrichedTask extends PendingTask {
  patientId: string;
  patientName: string;
  patientRut: string;
  date: string;
}

interface TaskGroupProps {
  title: string;
  tasks: EnrichedTask[];
  colorClass: string;
  icon: React.ReactNode;
  maxHeightClass?: string;
  onToggleTask: (patientId: string, taskId: string) => void;
  onNavigateToPatient: (patientId: string) => void;
  dateLabelForTask: (date: string) => string;
}

const TaskGroup: React.FC<TaskGroupProps> = ({
  title,
  tasks,
  colorClass,
  icon,
  maxHeightClass = 'max-h-64 md:max-h-72',
  onToggleTask,
  onNavigateToPatient,
  dateLabelForTask,
}) => {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-4 animate-fade-in glass-card rounded-panel border-none shadow-premium overflow-hidden flex flex-col">
      <div className={`flex items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800/50 ${colorClass}`}>
        <div className="p-1 rounded-lg mr-2 bg-white/50 dark:bg-gray-800/50 shadow-sm border border-black/5 dark:border-white/5">{icon}</div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">{title}</h3>
        <span className="ml-auto px-2 py-0.5 rounded-pill text-[9px] font-black bg-black/5 dark:bg-white/5 tracking-tighter shadow-inner">{tasks.length}</span>
      </div>
      <div className={`divide-y divide-gray-100/30 dark:divide-gray-800/30 ${maxHeightClass} overflow-y-auto custom-scrollbar`}>
        {tasks.map(task => (
          <div key={task.id} className="group relative transition-all duration-300 hover:bg-white/40 dark:hover:bg-brand-900/10">
            <div className="flex items-center px-4 py-2.5 gap-3">
              <button
                onClick={() => onToggleTask(task.patientId, task.id)}
                className="flex-shrink-0 transition-transform hover:scale-110 active:scale-90"
              >
                {task.isCompleted
                  ? <div className="p-0.5 rounded-md bg-green-500 text-white shadow-sm shadow-green-500/20"><CheckSquare className="w-3.5 h-3.5" /></div>
                  : <div className="p-0.5 rounded-md text-gray-300 dark:text-gray-600 hover:text-brand-500"><Square className="w-3.5 h-3.5" /></div>
                }
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <button
                    onClick={() => onNavigateToPatient(task.patientId)}
                    className="text-[10px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {task.patientName}
                  </button>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 whitespace-nowrap">
                    • {dateLabelForTask(task.date)}
                  </span>
                </div>
                <p className={`text-[12px] font-bold leading-tight tracking-tight ${task.isCompleted ? 'line-through text-gray-400 italic opacity-60' : 'text-gray-700 dark:text-gray-300'}`}>
                  {task.text}
                </p>
              </div>

              <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => onNavigateToPatient(task.patientId)}
                  className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 active:scale-95 transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskGroup;
