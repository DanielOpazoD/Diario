import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, Plus, Copy, MoveRight, FileText } from 'lucide-react';
import Button from '../../components/Button';
import CompactPatientCard from '../../components/CompactPatientCard';
import FilterBar from '../../components/FilterBar';
import TelegramSyncButton from '../../components/TelegramSyncButton';
import { PatientRecord, PatientTypeConfig } from '../../types';
import useAppStore from '../../stores/useAppStore';
import { useDailyMetrics } from '../../hooks/useDailyMetrics';
import { usePatientFilter } from '../../hooks/usePatientFilter';
import { useDailyRange } from '../../hooks/useDailyRange';
import { usePdfPatientImport } from '../../hooks/usePdfPatientImport';

interface DailyViewProps {
  currentDate: Date;
  records: PatientRecord[];
  patientTypes: PatientTypeConfig[];
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onGenerateReport: () => void;
  onMovePatients: (patientIds: string[], targetDate: string) => void;
  onCopyPatients: (patientIds: string[], targetDate: string) => void;
}

const DailyView: React.FC<DailyViewProps> = ({
  currentDate,
  records,
  patientTypes,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onGenerateReport,
  onMovePatients,
  onCopyPatients,
}) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());

  const addToast = useAppStore(state => state.addToast);
  const { targetDate, setTargetDate } = useDailyRange(currentDate);
  const { dailyRecords, pendingTasks } = useDailyMetrics(records, currentDate);
  const { activeFilter, setActiveFilter, summaryStats, visibleRecords } = usePatientFilter(
    dailyRecords,
    patientTypes,
  );

  const {
    fileInputRef,
    isImporting,
    handlePdfUpload,
    triggerPicker
  } = usePdfPatientImport(currentDate);

  const toggleSelectionMode = () => {
    setSelectionMode(prev => {
      if (prev) {
        setSelectedPatients(new Set());
      }
      return !prev;
    });
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients(prev => {
      const next = new Set(prev);
      if (next.has(patientId)) {
        next.delete(patientId);
      } else {
        next.add(patientId);
      }
      return next;
    });
  };

  const handleBatchMove = () => {
    if (selectedPatients.size === 0) {
      addToast('info', 'Selecciona al menos un paciente para mover.');
      return;
    }
    onMovePatients(Array.from(selectedPatients), targetDate);
    setSelectedPatients(new Set());
    setSelectionMode(false);
  };

  const handleBatchCopy = () => {
    if (selectedPatients.size === 0) {
      addToast('info', 'Selecciona al menos un paciente para copiar.');
      return;
    }
    onCopyPatients(Array.from(selectedPatients), targetDate);
    setSelectedPatients(new Set());
    setSelectionMode(false);
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="rounded-panel border border-gray-200/70 dark:border-gray-800/60 bg-white/90 dark:bg-gray-900/70 shadow-md backdrop-blur-sm px-4 py-3.5 mb-3 animate-fade-in space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Agenda diaria</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {dailyRecords.length} pacientes • {pendingTasks} tareas abiertas
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <TelegramSyncButton />
            <Button
              variant={selectionMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={toggleSelectionMode}
              className="rounded-pill"
            >
              {selectionMode ? 'Cancelar selección' : 'Gestionar pacientes'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onGenerateReport}
            >
              Reporte de turno
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePdfUpload}
              accept="application/pdf"
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={triggerPicker}
              isLoading={isImporting}
              icon={<FileText className="w-4 h-4" />}
            >
              Importar PDF
            </Button>
            <Button onClick={onAddPatient} size="sm" className="rounded-pill">
              Nuevo paciente
            </Button>
          </div>
        </div>

        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          stats={summaryStats}
          totalCount={dailyRecords.length}
        />
      </div>

      {selectionMode && (
        <div className="rounded-panel border border-blue-100 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-900/30 shadow-md px-4 py-3 mb-3 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100 font-medium">
              <span className="px-2 py-1 bg-white/70 dark:bg-blue-950/50 rounded-control border border-blue-100 dark:border-blue-800 shadow-soft">
                {selectedPatients.size} seleccionados
              </span>
              <button
                className="text-xs text-blue-800 dark:text-blue-200 underline"
                onClick={() => setSelectedPatients(new Set())}
              >
                Limpiar selección
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-3 py-2 rounded-md border border-blue-200 dark:border-blue-700 bg-white dark:bg-blue-950/60 text-sm shadow-soft"
              />
              <Button
                onClick={handleBatchMove}
                size="sm"
                variant="secondary"
                icon={<MoveRight className="w-4 h-4" />}
              >
                Mover a fecha
              </Button>
              <Button
                onClick={handleBatchCopy}
                size="sm"
                variant="primary"
                icon={<Copy className="w-4 h-4" />}
              >
                Copiar a fecha
              </Button>
            </div>
          </div>
        </div>
      )}

      {visibleRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center flex-1">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
            {activeFilter === 'all' ? <CalendarIcon className="w-8 h-8 opacity-50" /> : <Filter className="w-8 h-8 opacity-50" />}
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
                selectionMode={selectionMode}
                selected={selectedPatients.has(patient.id)}
                onToggleSelect={() => togglePatientSelection(patient.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyView;
