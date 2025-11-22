import React, { useMemo, useState } from 'react';
import { format, isSameDay } from 'date-fns';
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
}

const DailyView: React.FC<DailyViewProps> = ({
  currentDate,
  records,
  patientTypes,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
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

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="animate-fade-in">
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          stats={summaryStats}
          totalCount={dailyRecords.length}
        />
      </div>

      {visibleRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center flex-1">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
            {activeFilter === 'all' ? <CalendarIcon className="w-10 h-10 opacity-50" /> : <Filter className="w-10 h-10 opacity-50"/>}
          </div>
          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
            {activeFilter === 'all' ? 'Sin pacientes hoy' : `Sin pacientes en ${activeFilter}`}
          </h3>
          <p className="max-w-xs mx-auto mb-6 text-sm">
            {activeFilter === 'all'
              ? `No hay ingresos para el ${format(currentDate, "dd-MM-yyyy")}.`
              : 'Intenta seleccionar otro filtro o agrega un nuevo paciente.'}
          </p>
          {activeFilter === 'all' && (
            <Button onClick={onAddPatient} icon={<Plus className="w-4 h-4" />}>Agregar Primer Paciente</Button>
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
