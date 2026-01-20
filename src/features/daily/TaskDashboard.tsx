import React, { useMemo, useState, useRef } from 'react';
import { format, isSameDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square, Calendar, ArrowRight, AlertCircle, Clock, Sticker, Plus, Trash2 } from 'lucide-react';
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

  const renderTaskGroup = (title: string, tasks: EnrichedTask[], colorClass: string, icon: React.ReactNode) => {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-700/50">
          <div className={`p-1.5 rounded-lg mr-2 ${colorClass}`}>{icon}</div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">{title}</h3>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500">{tasks.length}</span>
        </div>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="group bg-white/95 dark:bg-gray-800/90 p-3 rounded-card shadow-card border border-gray-100 dark:border-gray-700/50 hover:shadow-elevated transition-all">
              <div className="flex justify-between items-start mb-1">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center uppercase">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(task.date + 'T00:00:00'), "d MMM", { locale: es })}
                </div>
                <button onClick={() => { const p = records.find(r => r.id === task.patientId); if (p) onNavigateToPatient(p); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500"><ArrowRight className="w-3 h-3" /></button>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-2 uppercase">{task.patientName}</h4>
              <div className="flex items-start gap-2">
                <button onClick={() => onTogglePatientTask(task.patientId, task.id)} className="flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors">
                  {task.isCompleted ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                </button>
                <p className={`text-xs leading-relaxed ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{task.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 h-[calc(100vh-120px)] flex flex-col">
      <div className="rounded-panel border border-gray-200/70 dark:border-gray-800/60 bg-white/85 dark:bg-gray-900/65 shadow-md backdrop-blur-sm px-4 py-3 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Centro de tareas</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">Prioriza tu día</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{pendingPatientTasks} tareas de pacientes • {pendingGeneralTasks} notas generales</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hoy: {todayPending} pendientes directos</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            <Button variant="secondary" size="sm" className="rounded-pill" onClick={() => setFilter('pending')}>
              Ver pendientes
            </Button>
            <Button size="sm" className="rounded-pill" onClick={() => quickAddRef.current?.focus()}>
              Nueva nota rápida
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1.5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Agrupa por estado</h2>
        <div className="flex bg-gray-200/70 dark:bg-gray-700/70 p-1 rounded-pill shadow-sm">
          {(['pending', 'all', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1.5 rounded-pill text-[11px] font-bold uppercase transition-all ${filter === f ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>{f === 'pending' ? 'Pendientes' : f === 'all' ? 'Todas' : 'Listas'}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* LEFT: Patient Context Tasks */}
        <div className="lg:col-span-7 overflow-y-auto pr-2 custom-scrollbar">
          {filteredPatientTasks.length === 0 && (
            <div className="text-center py-20 opacity-50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-panel">
              <CheckSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium">Sin tareas de pacientes</p>
            </div>
          )}
          {filter !== 'completed' && (
            <>
              {renderTaskGroup('Atrasadas', groupedTasks.overdue, 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400', <AlertCircle className="w-4 h-4" />)}
              {renderTaskGroup('Hoy', groupedTasks.todayTasks, 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', <Clock className="w-4 h-4" />)}
              {renderTaskGroup('Futuras', groupedTasks.upcoming, 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', <Calendar className="w-4 h-4" />)}
            </>
          )}
          {(filter === 'completed' || filter === 'all') && renderTaskGroup('Historial', groupedTasks.completed, 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', <CheckSquare className="w-4 h-4" />)}
        </div>

        {/* RIGHT: General Tasks (Sticky Note Style) */}
        <div className="lg:col-span-5 flex flex-col bg-yellow-50/60 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-panel p-5 h-full overflow-hidden relative shadow-soft">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-200/50 to-transparent rounded-bl-full pointer-events-none"></div>

          <div className="flex items-center gap-2 mb-4 text-yellow-800 dark:text-yellow-500">
            <Sticker className="w-5 h-5" />
            <h3 className="text-lg font-bold">Notas Rápidas</h3>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              ref={quickAddRef}
              value={newGeneralTask}
              onChange={e => setNewGeneralTask(e.target.value)}
              onKeyDown={handleAddGeneralTask}
              placeholder="Escribe y presiona Enter..."
              className="w-full bg-white dark:bg-gray-800 border border-yellow-100/60 dark:border-yellow-900/40 shadow-soft rounded-card py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
            />
            <Plus className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
            {generalTasks.length === 0 && (
              <div className="text-center mt-10 text-yellow-700/40 dark:text-yellow-500/30 text-sm italic">
                No hay recordatorios generales.
              </div>
            )}
            {generalTasks.sort((a, b) => b.createdAt - a.createdAt).map(task => (
              <div key={task.id} className={`group flex items-start p-3 bg-white/95 dark:bg-gray-800/90 rounded-card shadow-card border-l-4 transition-all ${task.isCompleted ? 'border-gray-300 opacity-60' : 'border-yellow-400 hover:translate-x-1'}`}>
                <button onClick={() => toggleGeneralTaskAction(task.id)} className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-yellow-500 transition-colors">
                  {task.isCompleted ? <CheckSquare className="w-4 h-4 text-gray-400" /> : <Square className="w-4 h-4" />}
                </button>
                <span className={`ml-3 text-sm flex-1 leading-snug ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                  {task.text}
                </span>
                <button onClick={() => deleteGeneralTaskAction(task.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;
