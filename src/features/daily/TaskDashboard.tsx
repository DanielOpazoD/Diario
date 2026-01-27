import React, { useMemo, useState, useRef } from 'react';
import { format, isSameDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square, Calendar, ArrowRight, AlertCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@core/ui';
import { PatientRecord, PendingTask, GeneralTask } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';

interface TaskDashboardProps {
  onNavigateToPatient: (patient: PatientRecord) => void;
}

interface EnrichedTask extends PendingTask {
  patientId: string;
  patientName: string;
  patientRut: string;
  date: string;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({ onNavigateToPatient }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [newGeneralTask, setNewGeneralTask] = useState('');
  const quickAddRef = useRef<HTMLInputElement>(null);

  // Access store
  const records = useAppStore(state => state.records);
  const updatePatient = useAppStore(state => state.updatePatient);
  const generalTasks = useAppStore(state => state.generalTasks);
  const addGeneralTask = useAppStore(state => state.addGeneralTask);
  const toggleGeneralTaskAction = useAppStore(state => state.toggleGeneralTask);
  const deleteGeneralTaskAction = useAppStore(state => state.deleteGeneralTask);

  // --- Patient Task Logic ---
  const onTogglePatientTask = (patientId: string, taskId: string) => {
    const patient = records.find(p => p.id === patientId);
    if (!patient) return;

    const updatedTasks = patient.pendingTasks.map(t =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updatePatient({ ...patient, pendingTasks: updatedTasks });
  };

  const allPatientTasks = useMemo(() => {
    const tasks: EnrichedTask[] = [];
    records.forEach(record => {
      record.pendingTasks.forEach(task => {
        tasks.push({
          ...task,
          patientId: record.id,
          patientName: record.name,
          patientRut: record.rut,
          date: record.date
        });
      });
    });
    return tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const filteredPatientTasks = useMemo(() => {
    if (filter === 'all') return allPatientTasks;
    return allPatientTasks.filter(t => filter === 'pending' ? !t.isCompleted : t.isCompleted);
  }, [allPatientTasks, filter]);

  const pendingPatientTasks = useMemo(
    () => allPatientTasks.filter(t => !t.isCompleted).length,
    [allPatientTasks]
  );

  const pendingGeneralTasks = useMemo(
    () => generalTasks.filter(task => !task.isCompleted).length,
    [generalTasks]
  );

  const todayPending = useMemo(
    () => {
      const today = new Date(new Date().setHours(0, 0, 0, 0));
      return allPatientTasks.filter(t => !t.isCompleted && isSameDay(new Date(t.date + 'T00:00:00'), today)).length;
    },
    [allPatientTasks]
  );

  const groupedTasks = useMemo(() => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const overdue: EnrichedTask[] = [];
    const todayTasks: EnrichedTask[] = [];
    const upcoming: EnrichedTask[] = [];
    const completed: EnrichedTask[] = [];

    filteredPatientTasks.forEach(task => {
      if (task.isCompleted) { completed.push(task); return; }
      const taskDate = new Date(task.date + 'T00:00:00');
      if (isSameDay(taskDate, today)) { todayTasks.push(task); }
      else if (isBefore(taskDate, today)) { overdue.push(task); }
      else { upcoming.push(task); }
    });

    return { overdue, todayTasks, upcoming, completed };
  }, [filteredPatientTasks]);

  // --- General Task Logic ---
  const handleAddGeneralTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newGeneralTask.trim()) {
      const task: GeneralTask = {
        id: crypto.randomUUID(),
        text: newGeneralTask,
        isCompleted: false,
        createdAt: Date.now(),
        priority: 'medium'
      };
      addGeneralTask(task);
      setNewGeneralTask('');
    }
  };

  const renderTaskGroup = (
    title: string,
    tasks: EnrichedTask[],
    colorClass: string,
    icon: React.ReactNode,
    maxHeightClass = 'max-h-64 md:max-h-72'
  ) => {
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
                  onClick={() => onTogglePatientTask(task.patientId, task.id)}
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
                      onClick={() => { const p = records.find(r => r.id === task.patientId); if (p) onNavigateToPatient(p); }}
                      className="text-[10px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {task.patientName}
                    </button>
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 whitespace-nowrap">
                      • {format(new Date(task.date + 'T00:00:00'), "d 'de' MMM", { locale: es })}
                    </span>
                  </div>
                  <p className={`text-[12px] font-bold leading-tight tracking-tight ${task.isCompleted ? 'line-through text-gray-400 italic opacity-60' : 'text-gray-700 dark:text-gray-300'}`}>
                    {task.text}
                  </p>
                </div>

                <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => { const p = records.find(r => r.id === task.patientId); if (p) onNavigateToPatient(p); }}
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

  return (
    <div className="max-w-5xl mx-auto pb-5 h-[calc(100vh-140px)] flex flex-col px-3 md:px-5">
      {/* Compact Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Mis Tareas</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-pill bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[9px] font-black uppercase tracking-tighter border border-amber-500/20">
              {pendingPatientTasks} Pacientes
            </span>
            <span className="px-2 py-0.5 rounded-pill bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[9px] font-black uppercase tracking-tighter border border-brand-500/20">
              {pendingGeneralTasks} Notas
            </span>
            {todayPending > 0 && (
              <span className="px-2 py-0.5 rounded-pill bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-tighter border border-red-500/20">
                {todayPending} Hoy
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100/80 dark:bg-gray-800/80 p-0.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            {(['pending', 'all', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                  ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-white shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-600'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
              >
                {f === 'pending' ? 'Pendientes' : f === 'all' ? 'Todas' : 'Listas'}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => quickAddRef.current?.focus()}
            className="rounded-xl h-8 bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20 font-black text-[10px] tracking-widest"
          >
            + NOTA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* LEFT: Task Groups */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto pr-1 no-scrollbar">
          {filteredPatientTasks.length === 0 && (
            <div className="flex-1 glass-card rounded-panel border-none shadow-premium flex flex-col items-center justify-center py-24 text-gray-400 text-center">
              <CheckSquare className="w-12 h-12 mb-4 opacity-10 text-brand-500" />
              <p className="text-sm font-black uppercase tracking-widest opacity-60">Sin tareas de pacientes</p>
              <p className="text-[10px] mt-1 font-bold opacity-40 uppercase">Todo está al día</p>
            </div>
          )}

          {filter !== 'completed' && (
            <>
              {renderTaskGroup('Atrasadas', groupedTasks.overdue, 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', <AlertCircle className="w-3.5 h-3.5" />, 'max-h-80 md:max-h-[26rem]')}
              {renderTaskGroup('Hoy', groupedTasks.todayTasks, 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20', <Clock className="w-3.5 h-3.5" />)}
              {renderTaskGroup('Futuras', groupedTasks.upcoming, 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', <Calendar className="w-3.5 h-3.5" />)}
            </>
          )}
          {(filter === 'completed' || filter === 'all') && renderTaskGroup('Listas', groupedTasks.completed, 'bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20', <CheckSquare className="w-3.5 h-3.5" />, 'max-h-80 md:max-h-[26rem]')}
        </div>

        {/* RIGHT: Quick Notes Panel */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
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
                onChange={e => setNewGeneralTask(e.target.value)}
                onKeyDown={handleAddGeneralTask}
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
                    onClick={() => toggleGeneralTaskAction(task.id)}
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
                    onClick={() => deleteGeneralTaskAction(task.id)}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;
