import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Calendar, FileText, ClipboardList, Save } from 'lucide-react';
import useAppStore from '@core/stores/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { AttachedFile, PatientRecord, PendingTask } from '@shared/types';
import { calculateAge, formatToDisplayDate } from '@shared/utils/dateUtils';
import InlinePatientTasks from '@core/patient/components/InlinePatientTasks';
import PatientAttachmentsSection from '@core/patient/components/PatientAttachmentsSection';
import usePendingTasks from '@core/patient/hooks/usePendingTasks';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PatientRecord | null;
  initialTab?: 'clinical' | 'files';
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ isOpen, onClose, record, initialTab = 'clinical' }) => {
  const { patientTypes, updatePatient, addToast } = useAppStore(useShallow(state => ({
    patientTypes: state.patientTypes,
    updatePatient: state.updatePatient,
    addToast: state.addToast,
  })));
  const [activeTab, setActiveTab] = useState<'clinical' | 'files'>(initialTab);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const lastRecordKeyRef = useRef<string | null>(null);

  const typeLabel = useMemo(() => {
    if (!record) return '';
    return patientTypes.find(t => t.id === record.typeId)?.label || record.type;
  }, [patientTypes, record]);

  useEffect(() => {
    if (!record || !isOpen) return;
    const recordKey = `${record.id}:${record.updatedAt || 0}:${initialTab}`;
    if (lastRecordKeyRef.current === recordKey) return;
    lastRecordKeyRef.current = recordKey;

    const nextTasks = record.pendingTasks || [];
    const nextFiles = record.attachedFiles || [];

    setPendingTasks(prev => (
      JSON.stringify(prev) === JSON.stringify(nextTasks) ? prev : nextTasks
    ));
    setAttachedFiles(prev => (
      JSON.stringify(prev) === JSON.stringify(nextFiles) ? prev : nextFiles
    ));
    setDriveFolderId(prev => (
      prev === (record.driveFolderId || null) ? prev : (record.driveFolderId || null)
    ));
    setActiveTab(prev => (prev === initialTab ? prev : initialTab));
  }, [isOpen, record?.id, record?.updatedAt, initialTab, record]);

  if (!isOpen || !record) return null;

  const completedTasks = pendingTasks.filter(t => t.isCompleted);
  const pendingOpenTasks = pendingTasks.filter(t => !t.isCompleted);
  const { toggleTask, deleteTask, addTask, updateTaskNote } = usePendingTasks({ setPendingTasks });

  const handleSave = () => {
    updatePatient({
      ...record,
      pendingTasks,
      attachedFiles,
      driveFolderId,
      updatedAt: Date.now(),
    });
    addToast('success', 'Historial actualizado');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-0 md:p-6">
      <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>

      <div className="relative w-full md:max-w-4xl glass md:rounded-panel shadow-premium-xl flex flex-col h-full md:h-auto md:max-h-[92vh] overflow-hidden animate-slide-up border-white/40 dark:border-white/10">
        <div className="flex items-center justify-between px-5 md:px-7 py-3 border-b border-gray-100/30 dark:border-gray-800/30 bg-white/40 dark:bg-gray-900/40 shrink-0 select-none backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2.5 rounded-2xl bg-brand-500 text-white shadow-brand-500/40 shadow-premium-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter">
                  {record.name}
                </h2>
                <span className="shrink-0 text-[10px] font-black bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-pill border border-brand-500/20 uppercase tracking-widest shadow-inner">
                  {formatToDisplayDate(record.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] whitespace-nowrap">
                {record.rut && <span className="text-brand-500/60">{record.rut}</span>}
                {record.birthDate && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <span>{calculateAge(record.birthDate)}</span>
                  </>
                )}
                {record.gender && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <span>{record.gender}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 group rounded-2xl transition-all duration-300 hover:rotate-90"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
          </button>
        </div>

        <div className="px-5 md:px-7 py-4 border-b border-gray-100/30 dark:border-gray-800/30 bg-white/30 dark:bg-gray-900/30">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-400">Tipo</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{typeLabel || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-400">RUT</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{record.rut || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-400">Nacimiento</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{record.birthDate || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-400">Género</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{record.gender || '—'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-400">Horario</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">
                {record.entryTime || record.exitTime ? `${record.entryTime || '--:--'} - ${record.exitTime || '--:--'}` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 md:px-7 pt-4">
          <button
            onClick={() => setActiveTab('clinical')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              activeTab === 'clinical'
                ? 'bg-brand-500 text-white border-brand-500 shadow-premium-sm'
                : 'bg-white/70 dark:bg-gray-900/60 text-gray-500 border-gray-100 dark:border-gray-800 hover:text-brand-500'
            }`}
          >
            Clínica
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              activeTab === 'files'
                ? 'bg-brand-500 text-white border-brand-500 shadow-premium-sm'
                : 'bg-white/70 dark:bg-gray-900/60 text-gray-500 border-gray-100 dark:border-gray-800 hover:text-brand-500'
            }`}
          >
            Archivos
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 md:px-7 py-4">
          {activeTab === 'clinical' ? (
            <div className="space-y-4">
              <div className="bg-white/70 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <FileText className="w-4 h-4 text-brand-500" />
                  Diagnóstico
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {record.diagnosis || 'Sin diagnóstico registrado.'}
                </p>
              </div>

              <div className="bg-white/70 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <ClipboardList className="w-4 h-4 text-brand-500" />
                  Nota clínica
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {record.clinicalNote || 'Sin notas clínicas.'}
                </p>
              </div>

              <div className="bg-white/70 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  <ClipboardList className="w-4 h-4 text-brand-500" />
                  Tareas
                </div>
                <InlinePatientTasks
                  pendingTasks={pendingTasks}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onAddTask={addTask}
                  onUpdateTaskNote={updateTaskNote}
                />
                {pendingOpenTasks.length === 0 && completedTasks.length === 0 && (
                  <p className="text-[11px] text-gray-500 mt-3">Sin tareas registradas.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <PatientAttachmentsSection
                attachedFiles={attachedFiles}
                patientId={record.id}
                patientRut={record.rut}
                patientName={record.name}
                driveFolderId={driveFolderId}
                addToast={addToast}
                onFilesChange={setAttachedFiles}
                onDriveFolderIdChange={setDriveFolderId}
                compact
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 md:px-7 py-3 border-t border-gray-100/30 dark:border-gray-800/30 bg-white/30 dark:bg-gray-900/30">
          <button
            type="button"
            onClick={onClose}
            className="px-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-500 bg-brand-500 text-white shadow-premium-sm hover:shadow-premium"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;
