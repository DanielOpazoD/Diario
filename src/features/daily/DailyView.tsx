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
    <div className="h-full min-h-0 flex flex-col max-w-5xl mx-auto px-4 md:px-6">
      {/* Minimalist Floating Glass Header */}
      <div className="sticky top-4 z-20 mb-6 group">
        <div className="glass shadow-premium-lg rounded-panel px-5 py-3 transition-all duration-500 border-white/40 dark:border-white/10 group-hover:shadow-premium-xl group-hover:border-white/60">
          <div className="flex items-center justify-between gap-4">
            {/* Filter Bar - Modern compact layout */}
            <div className="flex-1 min-w-0">
              <FilterBar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                stats={summaryStats}
                totalCount={dailyRecords.length}
              />
            </div>

            {/* Action Buttons - Premium styling */}
            <div className="flex gap-2 items-center shrink-0 pl-4 border-l border-gray-100 dark:border-gray-800/50">
              {pendingTasks > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-amber-500/10 text-amber-600 dark:text-amber-500 animate-pulse border border-amber-500/20">
                  <span className="text-[10px] font-black uppercase tracking-tighter">{pendingTasks}</span>
                  <span className="text-[9px]">⚡</span>
                </div>
              )}

              <div className="flex items-center gap-1 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <Button
                  variant={selectionMode ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={`min-w-[32px] h-8 rounded-lg !p-0 ${selectionMode ? 'bg-brand-500 shadow-brand-500/40' : 'text-gray-500'}`}
                >
                  {selectionMode ? '✕' : '☐'}
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                  accept="application/pdf"
                  multiple
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={triggerPicker}
                  isLoading={isImporting}
                  icon={<FileText className="w-4 h-4" />}
                  className="w-8 h-8 rounded-lg !p-0 text-gray-500 hover:text-brand-500 hover:bg-brand-500/10"
                />
              </div>

              <Button
                onClick={handleAddBlankPatient}
                size="sm"
                className="rounded-xl px-4 h-9 font-black bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/30 text-xs transition-all active:scale-95"
              >
                + NUEVO
              </Button>
            </div>
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
        <div className="flex-1 glass-card rounded-panel border-none shadow-premium flex flex-col items-center justify-center py-24 text-gray-400 text-center">
          <CalendarIcon className="w-12 h-12 mb-4 opacity-20 text-brand-500" />
          <p className="text-sm font-black uppercase tracking-widest opacity-60">No hay pacientes para mostrar</p>
          <p className="text-[10px] mt-1 font-bold opacity-40 uppercase">Selecciona otra fecha o agrega uno nuevo</p>
        </div>
      ) : visibleRecords.length > 20 ? (
        // Use virtualized list for large datasets
        <div className="flex-1 min-h-0 glass-card rounded-panel overflow-y-auto overflow-x-hidden border-none shadow-premium custom-scrollbar">
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
        </div>
      ) : (
        // Standard rendering for small lists
        <div className="flex-1 min-h-0 glass-card rounded-panel overflow-y-auto overflow-x-hidden border-none shadow-premium transition-all duration-500 custom-scrollbar">
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
