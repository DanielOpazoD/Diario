import React, { useState } from 'react';
import { format, differenceInYears } from 'date-fns';
import { CheckSquare, Square, ChevronDown, Clock, FileText, Trash2 } from 'lucide-react';
import { PatientRecord } from '../types';
import useAppStore from '../stores/useAppStore';

const parseLocalYMD = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateStr);
};

const calculateAge = (birthDateStr?: string) => {
  if (!birthDateStr) return '';
  try {
    const age = differenceInYears(new Date(), parseLocalYMD(birthDateStr));
    return `${age} años`;
  } catch (e) {
    return '';
  }
};

interface CompactPatientCardProps {
  patient: PatientRecord;
  onEdit: (p: PatientRecord) => void;
  onDelete: (id: string) => void;
}

const CompactPatientCard: React.FC<CompactPatientCardProps> = ({ patient, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const updatePatient = useAppStore(state => state.updatePatient);
  const patientTypes = useAppStore(state => state.patientTypes);

  const tasks = patient.pendingTasks || [];
  const pendingCount = tasks.filter(t => !t.isCompleted).length;

  const typeConfig = patientTypes.find(t => t.label === patient.type);
  const fullColorClass = typeConfig ? typeConfig.colorClass : 'bg-gray-100 text-gray-800 border-gray-200';
  const coreColor = fullColorClass.split('-')[1] || 'gray';
  const ageDisplay = calculateAge(patient.birthDate);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updatePatient({ ...patient, pendingTasks: updatedTasks });
  };

  return (
    <div className="group bg-white/95 dark:bg-gray-800/90 rounded-card shadow-card border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-all duration-200 hover:shadow-elevated mb-3">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-row items-stretch cursor-pointer min-h-[76px]"
      >
        <div className={`w-1.5 shrink-0 bg-${coreColor}-500`}></div>

        <div className="flex-1 flex items-center p-3 gap-3 relative overflow-hidden">
          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold bg-${coreColor}-50 text-${coreColor}-600 dark:bg-${coreColor}-900/20 dark:text-${coreColor}-400 uppercase shadow-soft border border-${coreColor}-100 dark:border-${coreColor}-800/50`}>
            {patient.name.substring(0, 2)}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                {patient.name}
              </h3>
              {ageDisplay && <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">• {ageDisplay}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] uppercase font-bold px-1.5 rounded-control bg-${coreColor}-50 text-${coreColor}-700 dark:bg-${coreColor}-900/30 dark:text-${coreColor}-300 border border-${coreColor}-100 dark:border-${coreColor}-800`}>
                  {patient.type}
                </span>
                {patient.entryTime && (
                  <span className="flex items-center text-xs font-mono gap-0.5 bg-gray-100 dark:bg-gray-700 px-2 rounded-control">
                    <Clock className="w-2.5 h-2.5" />
                    {patient.entryTime}
                  </span>
                )}
              </div>
            </div>

            {patient.diagnosis && (
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate pr-2 mt-0.5 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                {patient.diagnosis}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto flex-shrink-0 pl-1">
            {pendingCount > 0 && (
              <div
                className="flex flex-col sm:flex-row items-center sm:gap-1 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 sm:py-1 rounded-md border border-amber-100 dark:border-amber-800/30 min-w-[24px] sm:min-w-auto justify-center"
                title={`${pendingCount} tareas pendientes`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mb-0.5 sm:mb-0"></div>
                <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-500">{pendingCount}</span>
              </div>
            )}

            <div className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ${isExpanded ? 'rotate-180 bg-gray-100 dark:bg-gray-700' : ''}`}>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/50 animate-slide-down">
          <div className="mt-3 flex flex-wrap justify-between items-start gap-3">
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 uppercase tracking-wide font-medium">
              <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded-control border border-gray-100 dark:border-gray-600 shadow-soft">RUT: {patient.rut}</span>
              {patient.birthDate && <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded-control border border-gray-100 dark:border-gray-600 shadow-soft">{ageDisplay || format(parseLocalYMD(patient.birthDate), 'yyyy')}</span>}
              {patient.exitTime && <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded-control border border-gray-100 dark:border-gray-600 shadow-soft">Salida: {patient.exitTime}</span>}
            </div>
            <div className="flex gap-2 ml-auto w-full sm:w-auto justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(patient); }}
                className="flex-1 sm:flex-none justify-center text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-2 rounded-card transition-colors shadow-soft border border-blue-100 dark:border-blue-800"
              >
                Editar Ficha
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                className="flex-1 sm:flex-none justify-center text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 px-3 py-2 rounded-card transition-colors flex items-center gap-1 shadow-soft border border-red-100 dark:border-red-800"
              >
                <Trash2 className="w-3 h-3"/> Borrar
              </button>
            </div>
          </div>

          {patient.clinicalNote && (
            <div className="mt-4">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3"/> Nota Clínica
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-card border border-gray-200 dark:border-gray-700 shadow-soft border-l-4 border-l-blue-400 dark:border-l-blue-500">
                {patient.clinicalNote}
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/30">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1">
                <CheckSquare className="w-3 h-3"/> Tareas Pendientes
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-card bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 shadow-soft hover:border-blue-300 transition-all"
                  >
                    {task.isCompleted
                      ? <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0"/>
                      : <Square className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0"/>}
                    <span className={`text-xs font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactPatientCard;
