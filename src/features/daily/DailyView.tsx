import React from 'react';
import { Button } from '@core/ui';
import ExecutivePatientRow from '@core/patient/components/ExecutivePatientRow';
import VirtualizedPatientList from '@features/daily/VirtualizedPatientList';
import DailyHeader from '@features/daily/components/DailyHeader';
import BatchOperationsBar from '@features/daily/components/BatchOperationsBar';
import EmptyStateView from '@features/daily/components/EmptyStateView';

import { PatientRecord, PatientTypeConfig } from '@shared/types';
import { formatLocalYMD } from '@shared/utils/dateUtils';
import useAppStore from '@core/stores/useAppStore';
import { useDailyMetrics } from '@shared/hooks/useDailyMetrics';
import { usePatientFilter } from '@shared/hooks/usePatientFilter';
import { useBatchOperations } from '@shared/hooks/useBatchOperations';

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
  const selectedDate = formatLocalYMD(currentDate);

  // Batch operations hook - extracted from inline state
  const {
    selectionMode,
    selectedPatients,
    targetDate,
    toggleSelectionMode,
    togglePatientSelection,
    selectAll,
    clearSelection,
    setTargetDate,
    handleBatchMove,
    handleBatchCopy,
    selectedCount,
  } = useBatchOperations({
    onMovePatients,
    onCopyPatients,
    addToast,
    initialTargetDate: selectedDate,
  });

  const addPatient = useAppStore(state => state.addPatient);

  const handleAddBlankPatient = () => {
    const defaultTypeId = patientTypes[0]?.id || 'policlinico';
    const defaultTypeLabel = patientTypes[0]?.label || 'Policlínico';

    const blankPatient: PatientRecord = {
      id: crypto.randomUUID(),
      date: selectedDate,
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
    <div className="h-full min-h-0 flex flex-col max-w-5xl mx-auto px-3 md:px-5">
      <DailyHeader
        currentDate={currentDate}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        summaryStats={summaryStats}
        dailyRecordsCount={dailyRecords.length}
        pendingTasks={pendingTasks}
        selectionMode={selectionMode}
        toggleSelectionMode={toggleSelectionMode}
        onAddBlankPatient={handleAddBlankPatient}
      />

      {selectionMode && (
        <BatchOperationsBar
          selectedCount={selectedCount}
          visibleRecordsCount={visibleRecords.length}
          targetDate={targetDate}
          setTargetDate={setTargetDate}
          onSelectAll={() => selectAll(visibleRecords.map(p => p.id))}
          onClearSelection={clearSelection}
          onBatchMove={handleBatchMove}
          onBatchCopy={handleBatchCopy}
        />
      )}

      {visibleRecords.length === 0 ? (
        <EmptyStateView
          currentDate={currentDate}
          onAddBlankPatient={handleAddBlankPatient}
        />
      ) : visibleRecords.length > 20 ? (
        // Use virtualized list for large datasets
        <div className="flex-1 min-h-0 glass-card rounded-panel overflow-y-auto overflow-x-hidden border-none shadow-premium custom-scrollbar">
          <div className="flex items-center justify-between px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100/40 dark:border-gray-800/40">
            <span>{visibleRecords.length} pacientes</span>
            <span className="text-[9px] text-gray-400">Pendientes {pendingTasks}</span>
          </div>
          <VirtualizedPatientList
            patients={visibleRecords}
            onEdit={onEditPatient}
            onDelete={onDeletePatient}
            selectionMode={selectionMode}
            selectedPatients={selectedPatients}
            onToggleSelect={togglePatientSelection}
            addToast={addToast}
            selectedDate={selectedDate}
          />
        </div>
      ) : (
        // Standard rendering for small lists
        <div className="flex-1 min-h-0 glass-card rounded-panel overflow-y-auto overflow-x-hidden border-none shadow-premium transition-all duration-500 custom-scrollbar">
          <div className="flex items-center justify-between px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100/40 dark:border-gray-800/40">
            <span>{visibleRecords.length} pacientes</span>
            <span className="text-[9px] text-gray-400">Pendientes {pendingTasks}</span>
          </div>
          <div className="divide-y divide-gray-100/30 dark:divide-gray-800/30">
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
                selectedDate={selectedDate}
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
