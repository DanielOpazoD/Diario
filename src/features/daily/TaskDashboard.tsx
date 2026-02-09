import React, { useCallback, useMemo, useState, useRef } from 'react';
import { format, isSameDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Calendar, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@core/ui';
import { PatientRecord } from '@shared/types';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';
import { createGeneralTask, togglePatientTask } from '@use-cases/tasks';
import QuickNotesPanel from './components/QuickNotesPanel';
import TaskGroup, { EnrichedTask } from './components/TaskGroup';

interface TaskDashboardProps {
  onNavigateToPatient: (patient: PatientRecord) => void;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({ onNavigateToPatient }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [newGeneralTask, setNewGeneralTask] = useState('');
  const quickAddRef = useRef<HTMLInputElement>(null);

  // Access store
  const {
    records,
    updatePatient,
    generalTasks,
    addGeneralTask,
    toggleGeneralTaskAction,
    deleteGeneralTaskAction,
  } = useAppStore(useShallow(state => ({
    records: state.records,
    updatePatient: state.updatePatient,
    generalTasks: state.generalTasks,
    addGeneralTask: state.addGeneralTask,
    toggleGeneralTaskAction: state.toggleGeneralTask,
    deleteGeneralTaskAction: state.deleteGeneralTask,
  })));

  // --- Patient Task Logic ---
  const onTogglePatientTask = useCallback((patientId: string, taskId: string) => {
    const updatedPatient = togglePatientTask(records, patientId, taskId);
    if (updatedPatient) {
      updatePatient(updatedPatient);
    }
  }, [records, updatePatient]);

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
  const handleAddGeneralTask = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newGeneralTask.trim()) {
      const task = createGeneralTask(newGeneralTask);
      if (task) {
        addGeneralTask(task);
      }
      setNewGeneralTask('');
    }
  }, [addGeneralTask, newGeneralTask]);

  const renderTaskGroup = useCallback((
    title: string,
    tasks: EnrichedTask[],
    colorClass: string,
    icon: React.ReactNode,
    maxHeightClass = 'max-h-64 md:max-h-72'
  ) => (
    <TaskGroup
      title={title}
      tasks={tasks}
      colorClass={colorClass}
      icon={icon}
      maxHeightClass={maxHeightClass}
      onToggleTask={onTogglePatientTask}
      onNavigateToPatient={(patientId) => {
        const patient = records.find((record) => record.id === patientId);
        if (patient) onNavigateToPatient(patient);
      }}
      dateLabelForTask={(date) => format(new Date(date + 'T00:00:00'), "d 'de' MMM", { locale: es })}
    />
  ), [onNavigateToPatient, onTogglePatientTask, records]);

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
          <QuickNotesPanel
            generalTasks={generalTasks}
            newGeneralTask={newGeneralTask}
            onNewGeneralTaskChange={setNewGeneralTask}
            onNewGeneralTaskKeyDown={handleAddGeneralTask}
            onToggleGeneralTask={toggleGeneralTaskAction}
            onDeleteGeneralTask={deleteGeneralTaskAction}
            quickAddRef={quickAddRef}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;
