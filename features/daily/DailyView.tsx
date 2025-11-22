import React, { useMemo, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, Plus } from 'lucide-react';
import Button from '../../components/Button';
import CompactPatientCard from '../../components/CompactPatientCard';
import FilterBar from '../../components/FilterBar';
import { PatientRecord, PatientTypeConfig } from '../../types';

interface DailyViewProps {
  currentDate: Date;
  records: PatientRecord[];
  patientTypes: PatientTypeConfig[];
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onGenerateReport: () => void;
}

const DailyView: React.FC<DailyViewProps> = ({
  currentDate,
  records,
  patientTypes,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onGenerateReport,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const dailyRecords = useMemo(
    () => records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), currentDate)),
    [records, currentDate]
  );

  const summaryStats = useMemo(
    () => patientTypes.map(t => ({
      id: t.id,
      label: t.label,
      count: dailyRecords.filter(r => r.type === t.label).length,
      color: t.colorClass,
    })),
    [dailyRecords, patientTypes]
  );

  const visibleRecords = useMemo(
    () => {
      if (activeFilter === 'all') return dailyRecords;
      return dailyRecords.filter(r => r.type === activeFilter);
    },
    [dailyRecords, activeFilter]
  );

  const pendingTasks = useMemo(
    () => dailyRecords.reduce((acc, record) => acc + (record.pendingTasks?.filter(t => !t.isCompleted).length || 0), 0),
    [dailyRecords]
  );

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="rounded-panel border border-gray-200/70 dark:border-gray-800/60 bg-white/85 dark:bg-gray-900/65 shadow-md backdrop-blur-sm px-4 py-3 mb-3 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Agenda diaria</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
              {dailyRecords.length} pacientes • {pendingTasks} tareas abiertas
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={onGenerateReport}
            >
              Reporte de turno
            </Button>
            <Button onClick={onAddPatient} size="sm" className="rounded-pill">
              Nuevo paciente
            </Button>
          </div>
        </div>
      </div>

      <div className="animate-fade-in">
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          stats={summaryStats}
          totalCount={dailyRecords.length}
        />
      </div>

      {visibleRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center flex-1">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
            {activeFilter === 'all' ? <CalendarIcon className="w-8 h-8 opacity-50" /> : <Filter className="w-8 h-8 opacity-50"/>}
          </div>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">
            {activeFilter === 'all' ? 'Sin pacientes hoy' : `Sin pacientes en ${activeFilter}`}
          </h3>
          <p className="max-w-xs mx-auto mb-4 text-sm">
            {activeFilter === 'all'
              ? `No hay ingresos para el ${format(currentDate, "dd-MM-yyyy")}.`
              : 'Intenta seleccionar otro filtro o agrega un nuevo paciente.'}
          </p>
          {activeFilter === 'all' && (
            <Button onClick={onAddPatient} size="sm" icon={<Plus className="w-4 h-4" />}>Agregar Primer Paciente</Button>
          )}
        </div>
      ) : (
        <div className="flex-1 pb-20 md:pb-4 animate-fade-in">
          <div className="space-y-2">
            {visibleRecords.map(patient => (
              <CompactPatientCard
                key={patient.id}
                patient={patient}
                onEdit={() => onEditPatient(patient)}
                onDelete={() => onDeletePatient(patient.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyView;
