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
    onToggleSelect?: (id: string) => void;
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
        <div
            className={`group relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-b border-gray-100/60 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.02] hover:shadow-premium ${selectionMode && selected ? 'bg-brand-50/50 dark:bg-brand-500/10 ring-1 ring-brand-500/20' : ''}`}
            style={{ viewTransitionName: `patient-card-${patient.id}` }}
        >
            <div className="w-full max-w-full overflow-hidden">
                <div className="flex w-full">
                    {/* Color Indicator Strip - Refined with Glow */}
                    <div className={`w-1.5 shrink-0 ${!patient.name ? 'bg-gray-200 dark:bg-gray-800' : `bg-${coreColor}-500`} opacity-80 self-stretch rounded-r-pill my-2.5 ml-1 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(var(--brand-500-rgb),0.3)]`}></div>

                    {/* Main Row Content */}
                    <div
                        onClick={() => {
                            if (activeTab) {
                                setActiveTab(null);
                            }
                        }}
                        className={`flex-1 min-w-0 flex items-center px-3 gap-3 cursor-pointer overflow-hidden ${isCompactRow ? 'min-h-[52px] py-2.5' : 'min-h-[68px] py-4'}`}
                    >
                        {/* Selection Checkbox */}
                        {selectionMode && (
                            <div onClick={(e) => { e.stopPropagation(); onToggleSelect?.(patient.id); }} className="mr-1 shrink-0 transition-transform active:scale-90">
                                {selected ? <CheckSquare className="w-5 h-5 text-brand-600 animate-fade-in" /> : <Square className="w-5 h-5 text-gray-300 dark:text-gray-700 hover:text-gray-400" />}
                            </div>
                        )}

                        {/* Patient Info */}
                        <div className="flex-1 min-w-0">
                            {!patient.name ? (
                                // Blank patient - gray border, clickable to open demographics
                                <div className="flex items-center gap-2 w-full">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTabClick('demographics'); }}
                                        className="flex items-center h-9 flex-1 text-left hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-xl px-2 -ml-2 transition-all duration-300 group/new"
                                    >
                                        <span className="text-[13px] text-gray-400 italic font-medium group-hover/new:text-gray-500 tracking-tight">Nuevo paciente - clic para completar ficha</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                                        className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-[1fr_auto] items-center gap-1.5 w-full min-w-0">
                                        <div className="min-w-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTabClick('demographics'); }}
                                                className="text-[15px] font-extrabold text-gray-950 dark:text-white truncate leading-none hover:text-brand-600 dark:hover:text-brand-400 transition-all active:scale-[0.98] text-left tracking-tightest group-hover:translate-x-0.5 w-full block"
                                                title="Editar datos demográficos"
                                            >
                                                {patient.name}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0 justify-end">
                                            <span className="text-[13px] text-gray-400 dark:text-gray-500 font-extrabold tracking-tighter whitespace-nowrap">
                                                {calculateAge(patient.birthDate)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard?.writeText(patient.rut || '');
                                                    addToast('success', 'RUT copiado al portapapeles');
                                                }}
                                                className="hidden sm:inline-block font-mono text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 px-2.5 py-0.5 rounded-pill uppercase font-black tracking-widest shadow-inner hover:bg-white dark:hover:bg-white/10 hover:text-brand-600 transition-all active:scale-90 whitespace-nowrap"
                                                title="Copiar RUT"
                                            >
                                                {patient.rut}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                                                className="text-red-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90 shrink-0"
                                                title="Eliminar registro"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-1.5 opacity-90 w-full min-w-0">
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            <span className="font-extrabold text-brand-500/70 shrink-0 tracking-[0.15em] uppercase text-[9px] bg-brand-500/5 px-1.5 py-0.5 rounded-md">DG</span>
                                            <span className={`${patient.diagnosis ? 'text-gray-600 dark:text-gray-400 font-bold' : 'text-amber-500/60 italic font-medium'} truncate text-[12px] tracking-tight flex-1 min-w-0`}>
                                                {patient.diagnosis || 'Completar diagnóstico clínico'}
                                            </span>
                                        </div>
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
