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
      {/* Minimalist compact header */}
      <div className="sticky top-3 z-20 mb-4">
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100 px-4 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            {/* Filter Bar - Compact selector */}
            <div className="flex-1 min-w-0">
              <FilterBar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                stats={summaryStats}
                totalCount={dailyRecords.length}
              />
            </div>

            {/* Action Buttons - Premium styling */}
            <div className="flex gap-2 items-center shrink-0 pl-3 border-l border-gray-100">
              {pendingTasks > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                  <span className="text-[10px] font-black uppercase tracking-tighter">{pendingTasks}</span>
                  <span className="text-[9px]">⚡</span>
                </div>
              )}

              <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl border border-gray-200/60">
                <Button
                  variant={selectionMode ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={`min-w-[30px] h-7 rounded-lg !p-0 ${selectionMode ? 'bg-brand-500 shadow-brand-500/30' : 'text-gray-500 hover:text-gray-700'}`}
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
                  className="w-7 h-7 rounded-lg !p-0 text-gray-500 hover:text-brand-500 hover:bg-brand-500/10"
                />
              </div>

              <Button
                onClick={handleAddBlankPatient}
                size="sm"
                className="rounded-xl px-3.5 h-8 font-black bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 text-[11px] tracking-wide transition-all active:scale-95"
              >
                + NUEVO
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selectionMode && (
        <div className="bg-blue-50/70 px-4 py-2 flex items-center justify-between border border-blue-100 rounded-xl mb-3 text-sm">
          <span className="font-medium text-blue-800">{selectedPatients.size} seleccionados</span>
          <div className="flex items-center gap-2">
            <button className="text-blue-600 hover:underline px-2" onClick={clearSelection}>Limpiar</button>
            <div className="h-4 w-px bg-blue-200"></div>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-blue-200 text-xs bg-white"
            />
            <Button onClick={handleBatchMove} size="sm" variant="secondary" className="h-7 text-xs">Mover</Button>
            <Button onClick={handleBatchCopy} size="sm" variant="primary" className="h-7 text-xs">Copiar</Button>
          </div>
        </div>
      )}

      {visibleRecords.length === 0 ? (
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 text-gray-400 text-center">
          <CalendarIcon className="w-12 h-12 mb-4 opacity-20 text-brand-500" />
          <p className="text-sm font-black uppercase tracking-widest opacity-60">No hay pacientes para mostrar</p>
          <p className="text-[10px] mt-1 font-bold opacity-40 uppercase">Selecciona otra fecha o agrega uno nuevo</p>
        </div>
      ) : visibleRecords.length > 20 ? (
        // Use virtualized list for large datasets
        <div className="flex-1 min-h-0 bg-white rounded-3xl overflow-y-auto overflow-x-hidden border border-gray-100 shadow-sm custom-scrollbar">
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
        <div className="flex-1 min-h-0 bg-white rounded-3xl overflow-y-auto overflow-x-hidden border border-gray-100 shadow-sm transition-all duration-500 custom-scrollbar">
          <div className="divide-y divide-gray-100">
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
