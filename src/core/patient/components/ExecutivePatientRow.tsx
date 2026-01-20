import React, { useState } from 'react';
import { differenceInYears } from 'date-fns';
import { CheckSquare, Square, ChevronDown, Trash2, Paperclip, Stethoscope, FileText } from 'lucide-react';
import { PatientRecord } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import InlinePatientEditor from './InlinePatientEditor';

const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return '';
    try {
        const parts = birthDateStr.split('-');
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const age = differenceInYears(new Date(), date);
            return Number.isNaN(age) ? '' : `${age}a`;
        }
        return '';
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'demographics' | 'clinical' | 'files' | 'tasks' | null>(null);

    const updatePatient = useAppStore(state => state.updatePatient);
    const patientTypes = useAppStore(state => state.patientTypes);

    const tasks = patient.pendingTasks || [];
    const pendingCount = tasks.filter(t => !t.isCompleted).length;
    const attachmentsCount = patient.attachedFiles?.length || 0;

    const typeConfig = patientTypes.find(t => t.label === patient.type);
    const coreColor = typeConfig ? typeConfig.colorClass.split('-')[1] || 'gray' : 'gray';

    const handleToggleTask = (taskId: string) => {
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        );
        updatePatient({ ...patient, pendingTasks: updatedTasks });
    };

    const handleTabClick = (tab: 'demographics' | 'clinical' | 'files' | 'tasks') => {
        if (activeTab === tab) {
            setActiveTab(null);
        } else {
            setActiveTab(tab);
            setIsExpanded(true); // Ensure row is expanded to show editor
        }
    };

    const handleSaveInline = (updatedPatient: PatientRecord) => {
        updatePatient(updatedPatient);
        addToast('success', 'Cambios guardados correctamente');
        setActiveTab(null);
    };

    return (
        <div className={`group relative border-b overflow-hidden ${!patient.name ? 'border-gray-300 dark:border-gray-600 border-2 rounded-lg my-1 mx-1' : 'border-gray-100 dark:border-gray-800'} last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${selectionMode && selected ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
            <div className="flex">
                {/* Color Indicator Strip */}
                <div className={`w-1.5 shrink-0 ${!patient.name ? 'bg-gray-400' : `bg-${coreColor}-500`} opacity-100 self-stretch rounded-r-sm my-1 ml-0.5`}></div>

                {/* Main Row Content */}
                <div
                    onClick={() => {
                        if (activeTab) {
                            setActiveTab(null); // Close editor if open
                        } else {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                    className="flex-1 flex items-center px-3 py-2.5 gap-3 cursor-pointer min-h-[56px] overflow-hidden"
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTabClick('demographics'); }}
                                        className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                                        title="Editar datos demográficos"
                                    >
                                        {patient.name}
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                            {calculateAge(patient.birthDate)}
                                        </span>
                                        <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                            {patient.rut}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                                            className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            title="Eliminar Paciente"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                                    <span className="font-bold text-gray-400 shrink-0">DG:</span>
                                    <span className={`${patient.diagnosis ? 'text-gray-600 dark:text-gray-300' : 'text-amber-500/70 italic'} truncate`}>
                                        {patient.diagnosis || 'completar con diagnóstico'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Indicators & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {attachmentsCount > 0 && (
                            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        )}

                        {pendingCount > 0 && (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-[10px] font-bold text-amber-600 dark:text-amber-500">
                                {pendingCount}
                            </div>
                        )}

                        {/* Split Action Buttons */}
                        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-100 dark:border-gray-800">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleTabClick('clinical'); }}
                                className={`p-1.5 rounded-md transition-colors ${activeTab === 'clinical' ? 'bg-teal-100 text-teal-700' : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20'}`}
                                title="Ficha Clínica"
                            >
                                <Stethoscope className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleTabClick('files'); }}
                                className={`p-1.5 rounded-md transition-colors ${activeTab === 'files' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                title="Archivos"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleTabClick('tasks'); }}
                                className={`p-1.5 rounded-md transition-colors ${activeTab === 'tasks' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                                title="Tareas"
                            >
                                <CheckSquare className="w-4 h-4" />
                            </button>
                        </div>

                        <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 ml-1 ${isExpanded || activeTab ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            {/* Inline Editor Area */}
            {activeTab && (
                <div className="border-t border-gray-100 dark:border-gray-800 overflow-hidden w-full max-w-full">
                    <InlinePatientEditor
                        patient={patient}
                        initialTab={activeTab}
                        onClose={() => setActiveTab(null)}
                        onSave={handleSaveInline}
                        addToast={addToast}
                        selectedDate={selectedDate}
                    />
                </div>
            )}

            {/* Expanded Content (View Only) - Hide if Editor is Open */}
            {isExpanded && !activeTab && (
                <div className="px-5 pb-4 pl-8 border-l-[6px] border-transparent ml-0.5 animate-slide-down">

                    {/* Tasks List */}
                    {tasks.length > 0 && (
                        <div className="mb-3 space-y-1 mt-2">
                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Tareas</div>
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => handleToggleTask(task.id)}
                                    className="flex items-center gap-2 cursor-pointer group py-0.5"
                                >
                                    {task.isCompleted
                                        ? <CheckSquare className="w-4 h-4 text-green-500" />
                                        : <Square className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />}
                                    <span className={`text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {task.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Clinical Note Snippet */}
                    {patient.clinicalNote && (
                        <div className={`text-sm text-gray-600 dark:text-gray-300 pt-2 ${tasks.length > 0 ? 'border-t border-gray-100 dark:border-gray-800' : 'mt-1'}`}>
                            <div className="flex gap-2">
                                <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <span className="whitespace-pre-wrap leading-relaxed opacity-90">{patient.clinicalNote}</span>
                            </div>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                        <div className="text-xs text-gray-400">
                            {patient.entryTime && <span>Ingreso: <span className="font-mono">{patient.entryTime}</span></span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutivePatientRow;
