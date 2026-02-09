import React, { useCallback, useMemo, useState } from 'react';
import { differenceInYears } from 'date-fns';
import { parseBirthDate } from '@shared/utils/dateUtils';
import { CheckSquare, Square, Trash2, Paperclip, Stethoscope } from 'lucide-react';
import { PatientRecord } from '@shared/types';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';
import InlinePatientEditor from './InlinePatientEditor';
import TaskStatusIndicator from '@core/components/TaskStatusIndicator';

const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return '';
    try {
        const parsed = parseBirthDate(birthDateStr);
        if (!parsed) return '';
        const age = differenceInYears(new Date(), parsed);
        return Number.isNaN(age) ? '' : `${age}a`;
    } catch (e) {
        return '';
    }
};

interface ExecutivePatientRowProps {
    patient: PatientRecord;
    onEdit: (p: PatientRecord) => void;
    onDelete: (id: string) => void;
    selectionMode?: boolean;
    selected?: boolean;
    onToggleSelect?: () => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
    selectedDate: string;
}

const ExecutivePatientRow: React.FC<ExecutivePatientRowProps> = ({
    patient,
    onDelete,
    selectionMode,
    selected,
    onToggleSelect,
    addToast,
    selectedDate
}) => {
    const [activeTab, setActiveTab] = useState<'demographics' | 'clinical' | 'files' | 'tasks' | null>(null);

    const { updatePatient, patientTypes } = useAppStore(useShallow(state => ({
        updatePatient: state.updatePatient,
        patientTypes: state.patientTypes,
    })));

    const tasks = useMemo(() => patient.pendingTasks || [], [patient.pendingTasks]);
    const pendingCount = useMemo(() => tasks.filter(t => !t.isCompleted).length, [tasks]);
    const completedCount = useMemo(() => tasks.filter(t => t.isCompleted).length, [tasks]);
    const attachmentsCount = useMemo(() => patient.attachedFiles?.length || 0, [patient.attachedFiles]);
    const isCompactRow = !patient.diagnosis && !patient.clinicalNote && tasks.length === 0 && attachmentsCount === 0;

    const typeConfig = useMemo(() => patientTypes.find(t => t.label === patient.type), [patientTypes, patient.type]);
    const coreColor = useMemo(() => (typeConfig ? typeConfig.colorClass.split('-')[1] || 'gray' : 'gray'), [typeConfig]);

    const handleTabClick = useCallback((tab: 'demographics' | 'clinical' | 'files' | 'tasks') => {
        setActiveTab(prev => (prev === tab ? null : tab));
    }, []);

    const handleSaveInline = useCallback((updatedPatient: PatientRecord) => {
        updatePatient(updatedPatient);
        addToast('success', 'Cambios guardados correctamente');
        setActiveTab(null);
    }, [addToast, updatePatient]);

    const handleAutoSaveInline = useCallback((updatedPatient: PatientRecord) => {
        updatePatient(updatedPatient);
    }, [updatePatient]);

    const taskButtonClassName = useMemo(() => {
        if (activeTab === 'tasks') return 'bg-amber-500 text-white shadow-amber-500/30';
        if (pendingCount > 0) return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100';
        if (completedCount > 0) return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100';
        return 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30';
    }, [activeTab, completedCount, pendingCount]);

    return (
        <div className={`group relative overflow-hidden transition-all duration-300 border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-white/40 dark:hover:bg-brand-900/10 hover:shadow-premium-sm ${selectionMode && selected ? 'bg-brand-50/50 dark:bg-brand-900/20 ring-1 ring-brand-500/20' : ''}`}>
            <div className="w-full max-w-full overflow-hidden">
            <div className="flex">
                {/* Color Indicator Strip - Refined */}
                <div className={`w-1 shrink-0 ${!patient.name ? 'bg-gray-300/50' : `bg-${coreColor}-500/80`} opacity-100 self-stretch rounded-r-pill my-2 ml-1 shadow-[0_0_10px_rgba(var(--brand-500-rgb),0.2)]`}></div>

                {/* Main Row Content */}
                <div
                    onClick={() => {
                        if (activeTab) {
                            setActiveTab(null);
                        }
                    }}
                    className={`flex-1 flex items-center px-4 gap-3 cursor-pointer overflow-hidden ${isCompactRow ? 'min-h-[48px] py-2' : 'min-h-[60px] py-3'}`}
                >
                    {/* Selection Checkbox */}
                    {selectionMode && (
                        <div onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }} className="mr-1 shrink-0">
                            {selected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-300" />}
                        </div>
                    )}

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0 pr-2">
                        {!patient.name ? (
                            // Blank patient - gray border, clickable to open demographics
                            <div className="flex items-center gap-2 w-full">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleTabClick('demographics'); }}
                                    className="flex items-center h-8 flex-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -ml-1 transition-colors"
                                >
                                    <span className="text-sm text-gray-400 italic">Nuevo paciente - clic para editar</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                                    className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-all"
                                    title="Eliminar Paciente"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTabClick('demographics'); }}
                                        className="text-base font-black text-gray-900 dark:text-white truncate leading-none hover:text-brand-600 dark:hover:text-brand-400 transition-all border-b border-transparent hover:border-brand-500/30 active:scale-95 text-left tracking-tight"
                                        title="Editar datos demográficos"
                                    >
                                        {patient.name}
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 dark:text-gray-500 font-black tracking-tighter">
                                            {calculateAge(patient.birthDate)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard?.writeText(patient.rut || '');
                                                addToast('success', 'RUT copiado');
                                            }}
                                            className="font-mono text-[9px] text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-2 py-0.5 rounded-pill uppercase font-black tracking-widest shadow-inner hover:text-gray-600 hover:border-gray-300 transition-colors"
                                            title="Copiar RUT"
                                        >
                                            {patient.rut}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                                            className="text-red-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                            title="Eliminar Paciente"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-1 text-[11px] opacity-80">
                                    <span className="font-black text-brand-500/60 shrink-0 tracking-widest uppercase text-[9px]">DG</span>
                                    <span className={`${patient.diagnosis ? 'text-gray-600 dark:text-gray-400' : 'text-amber-500/60 italic'} truncate font-semibold tracking-tight`}>
                                        {patient.diagnosis || 'Pendiente de diagnóstico'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Indicators & Actions */}
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Split Action Buttons - Glass Aesthetic */}
                        <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-gray-100 dark:border-gray-800/50">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleTabClick('clinical'); }}
                                className={`p-2 rounded-xl transition-all duration-300 shadow-premium-sm ${activeTab === 'clinical' ? 'bg-brand-500 text-white shadow-brand-500/30' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30'}`}
                                title="Ficha Clínica"
                            >
                                <Stethoscope className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleTabClick('files'); }}
                                className={`relative p-2 rounded-xl transition-all duration-300 shadow-premium-sm ${activeTab === 'files' ? 'bg-indigo-500 text-white shadow-indigo-500/30' : attachmentsCount > 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                                title="Archivos"
                            >
                                <Paperclip className="w-4 h-4" />
                                {attachmentsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[9px] font-black leading-4 text-center shadow">
                                        {attachmentsCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleTabClick('tasks'); }}
                                className={`min-w-[36px] h-9 flex items-center justify-center rounded-xl transition-all duration-300 shadow-premium-sm ${taskButtonClassName}`}
                                title={`Tareas: ${pendingCount} pendientes, ${completedCount} completadas`}
                            >
                                <TaskStatusIndicator
                                    pendingCount={pendingCount}
                                    completedCount={completedCount}
                                    iconClassName="w-4 h-4"
                                />
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Inline Editor Area */}
            {activeTab && (
                <div className={`w-full max-w-full overflow-hidden ${activeTab === 'demographics' && !patient.name ? '' : 'border-t border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex">
                        <div className="w-1 shrink-0 ml-1 my-2 opacity-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                            <InlinePatientEditor
                                patient={patient}
                                initialTab={activeTab}
                                onClose={() => setActiveTab(null)}
                                onSave={handleSaveInline}
                                onAutoSave={handleAutoSaveInline}
                                addToast={addToast}
                                selectedDate={selectedDate}
                            />
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>
    );
};

export default React.memo(ExecutivePatientRow);
