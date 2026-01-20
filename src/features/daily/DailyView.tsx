import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, FileText } from 'lucide-react';
import { Button } from '@core/ui';
import { ExecutivePatientRow } from '@core/patient';
import FilterBar from '@features/daily/FilterBar';
import VirtualizedPatientList from '@features/daily/VirtualizedPatientList';

import { PatientRecord, PatientTypeConfig } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import { useDailyMetrics } from '@shared/hooks/useDailyMetrics';
import { usePatientFilter } from '@shared/hooks/usePatientFilter';
import { useBatchOperations } from '@shared/hooks/useBatchOperations';
import { usePdfPatientImport } from '@core/patient';

interface DailyViewProps {
  currentDate: Date;
  records: PatientRecord[];
  patientTypes: PatientTypeConfig[];
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord, initialTab?: 'clinical' | 'files') => void;
  onDeletePatient: (patientId: string) => void;
  onMovePatients: (patientIds: string[], targetDate: string) => void;
  onCopyPatients: (patientIds: string[], targetDate: string) => void;
}

const DailyView: React.FC<DailyViewProps> = ({
  currentDate,
  records,
  patientTypes,
  onEditPatient,
  onDeletePatient,
  onMovePatients,
  onCopyPatients,
}) => {
  const addToast = useAppStore(state => state.addToast);
  const { dailyRecords, pendingTasks } = useDailyMetrics(records, currentDate);
  const { activeFilter, setActiveFilter, summaryStats, visibleRecords } = usePatientFilter(
    dailyRecords,
    patientTypes,
  );

  // Batch operations hook - extracted from inline state
  const {
    selectionMode,
    selectedPatients,
    targetDate,
    toggleSelectionMode,
    togglePatientSelection,
    clearSelection,
    setTargetDate,
    handleBatchMove,
    handleBatchCopy,
  } = useBatchOperations({
    onMovePatients,
    onCopyPatients,
    addToast,
    initialTargetDate: format(currentDate, 'yyyy-MM-dd'),
  });

  const {
    fileInputRef,
    isImporting,
    handlePdfUpload,
    triggerPicker
  } = usePdfPatientImport(currentDate);

  const addPatient = useAppStore(state => state.addPatient);

  const handleAddBlankPatient = () => {
    const defaultTypeId = patientTypes[0]?.id || 'policlinico';
    const defaultTypeLabel = patientTypes[0]?.label || 'Policlínico';

    const blankPatient: PatientRecord = {
      id: crypto.randomUUID(),
      date: format(currentDate, 'yyyy-MM-dd'),
      name: '',
      rut: '',
      birthDate: '',
      gender: '',
      type: defaultTypeLabel,
      typeId: defaultTypeId,
      diagnosis: '',
      clinicalNote: '',
      pendingTasks: [],
      attachedFiles: [],
      createdAt: Date.now(),
    };

    addPatient(blankPatient);
    addToast('info', 'Nuevo paciente en blanco creado. Haz clic para completar sus datos.');
  };



  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      {/* Minimalist Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-4 py-2 mb-0 transition-all">
        <div className="flex items-center justify-between gap-2">
          {/* Filter Bar - Left aligned, subtle */}
          <div className="flex-1 overflow-hidden">
            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              stats={summaryStats}
              totalCount={dailyRecords.length}
            />
          </div>

          {/* Action Buttons - Right aligned */}
          <div className="flex gap-1.5 items-center shrink-0">
            {pendingTasks > 0 && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500">
                {pendingTasks} ⚡
              </span>
            )}
            <Button
              variant={selectionMode ? 'primary' : 'ghost'}
              size="sm"
              onClick={toggleSelectionMode}
              className="px-2 text-xs h-7"
            >
              {selectionMode ? '✕' : '☐'}
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePdfUpload}
              accept="application/pdf"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerPicker}
              isLoading={isImporting}
              icon={<FileText className="w-3.5 h-3.5" />}
              className="px-2 text-gray-500 text-xs h-7"
            />
            <Button onClick={handleAddBlankPatient} size="sm" className="rounded-md px-2.5 text-xs h-7">
              +
            </Button>
          </div>
        </div>
      </div>

      {selectionMode && (
        <div className="bg-blue-50/90 dark:bg-blue-900/20 px-4 py-2 flex items-center justify-between border-b border-blue-100 dark:border-blue-800 animate-slide-down text-sm">
          <span className="font-medium text-blue-800 dark:text-blue-200">{selectedPatients.size} seleccionados</span>
          <div className="flex items-center gap-2">
            <button className="text-blue-600 hover:underline px-2" onClick={clearSelection}>Limpiar</button>
            <div className="h-4 w-px bg-blue-200"></div>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-2 py-1 rounded border border-blue-200 text-xs"
            />
            <Button onClick={handleBatchMove} size="sm" variant="secondary" className="h-7 text-xs">Mover</Button>
            <Button onClick={handleBatchCopy} size="sm" variant="primary" className="h-7 text-xs">Copiar</Button>
          </div>
        </div>
      )}

      {visibleRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center flex-1">
          <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No hay pacientes para mostrar</p>
        </div>
      ) : visibleRecords.length > 20 ? (
        // Use virtualized list for large datasets
        <VirtualizedPatientList
          patients={visibleRecords}
          onEdit={onEditPatient}
          onDelete={onDeletePatient}
          selectionMode={selectionMode}
          selectedPatients={selectedPatients}
          onToggleSelect={togglePatientSelection}
          addToast={addToast}
          selectedDate={format(currentDate, 'yyyy-MM-dd')}
        />
      ) : (
        // Standard rendering for small lists
        <div className="flex-1 bg-white dark:bg-gray-900 shadow-sm">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {visibleRecords.map(patient => (
              <ExecutivePatientRow
                key={patient.id}
                patient={patient}
                onEdit={(patient) => onEditPatient(patient)}
                onDelete={() => onDeletePatient(patient.id)}
                selectionMode={selectionMode}
                selected={selectedPatients.has(patient.id)}
                onToggleSelect={() => togglePatientSelection(patient.id)}
                addToast={addToast}
                selectedDate={format(currentDate, 'yyyy-MM-dd')}
              />
            ))}
          </div>
          {/* Bottom spacer for FAB/Scroll */}
          <div className="h-20"></div>
        </div>
      )}
    </div>
  );


};

export default DailyView;

