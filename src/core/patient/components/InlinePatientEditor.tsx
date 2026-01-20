import React, { useState } from 'react';
import { Save, X, Square } from 'lucide-react';
import { PatientRecord, PendingTask, AttachedFile } from '@shared/types';
import { Button } from '@core/ui';
import useAppStore from '@core/stores/useAppStore';
import ClinicalNote from '@core/patient/components/ClinicalNote';
import PatientIdentificationPanel from '@core/patient/components/PatientIdentificationPanel';
import PatientAttachmentsSection from '@core/patient/components/PatientAttachmentsSection';
import { formatPatientName } from '@core/patient/utils/patientUtils';
import { sanitizeClinicalNote, sanitizeDiagnosis, sanitizeRut } from '@shared/utils/sanitization';
import { usePatientVoiceAndAI } from '@core/patient';
import { usePatientDataExtraction } from '@core/patient';

interface InlinePatientEditorProps {
    patient: PatientRecord;
    initialTab: 'demographics' | 'clinical' | 'files' | 'tasks';
    onClose: () => void;
    onSave: (patient: PatientRecord) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
    selectedDate: string;
}

const InlinePatientEditor: React.FC<InlinePatientEditorProps> = ({
    patient,
    initialTab,
    onClose,
    onSave,
    addToast,
    selectedDate
}) => {
    const patientTypes = useAppStore(state => state.patientTypes);

    // Form State
    const [name, setName] = useState(patient.name);
    const [rut, setRut] = useState(patient.rut);
    const [birthDate, setBirthDate] = useState(patient.birthDate || '');
    const [gender, setGender] = useState(patient.gender || '');
    const [entryTime, setEntryTime] = useState(patient.entryTime || '');
    const [exitTime, setExitTime] = useState(patient.exitTime || '');
    const [type, setType] = useState(patient.type);
    const defaultTypeId = patientTypes.find(t => t.id === 'policlinico')?.id || patientTypes[0]?.id || '';
    const [typeId, setTypeId] = useState(patient.typeId || patientTypes.find(t => t.label === patient.type)?.id || defaultTypeId);

    const [diagnosis, setDiagnosis] = useState(patient.diagnosis);
    const [clinicalNote, setClinicalNote] = useState(patient.clinicalNote);
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>(patient.pendingTasks || []);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(patient.attachedFiles || []);
    const [driveFolderId, setDriveFolderId] = useState<string | null>(patient.driveFolderId || null);

    // AI & Voice Hooks
    const {
        isAnalyzing,
        isSummarizing,
        isListening,
        toggleListening,
        handleAIAnalysis,
        handleClinicalSummary,
    } = usePatientVoiceAndAI({
        clinicalNote,
        patientName: name,
        setClinicalNote,
        setDiagnosis,
        setPendingTasks,
        addToast,
    });

    const {
        isExtractingFromFiles,
        handleExtractFromAttachments,
    } = usePatientDataExtraction({
        addToast,
        selectedDate,
        onClose,
        setName,
        setRut,
        setBirthDate,
        setGender,
    });

    const handleSave = () => {
        if (!name.trim()) return addToast('error', 'Nombre requerido');

        const finalName = formatPatientName(name);
        const selectedType = patientTypes.find(t => t.id === typeId);

        const updatedPatient: PatientRecord = {
            ...patient,
            name: finalName,
            rut: sanitizeRut(rut),
            birthDate,
            gender,
            type: selectedType?.label || type,
            typeId: selectedType?.id || typeId,
            entryTime: entryTime || undefined,
            exitTime: exitTime || undefined,
            diagnosis: sanitizeDiagnosis(diagnosis),
            clinicalNote: sanitizeClinicalNote(clinicalNote),
            pendingTasks,
            attachedFiles,
            driveFolderId
        };

        onSave(updatedPatient);
    };

    const handleExtractFromAttachmentsWrapper = () => {
        handleExtractFromAttachments(attachedFiles, { name, rut, birthDate, gender });
    };

    // Task Helpers
    const toggleTask = (id: string) => { setPendingTasks(tasks => tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)); };
    const deleteTask = (id: string) => { setPendingTasks(tasks => tasks.filter(t => t.id !== id)); };
    const addTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), text: e.currentTarget.value, isCompleted: false }]);
            e.currentTarget.value = '';
        }
    };

    // Render Helpers
    const isTurno = typeId === (patientTypes.find(t => t.id === 'turno')?.id || 'turno');

    return (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-inner px-4 py-1 animate-slide-down overflow-hidden w-full max-w-full min-w-0">
            <div className="flex justify-end items-center">
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
            </div>

            <div className="w-full max-w-full overflow-hidden min-w-0">
                {initialTab === 'demographics' && (
                    <div className="w-full min-w-0 overflow-hidden">
                        <PatientIdentificationPanel
                            name={name}
                            rut={rut}
                            birthDate={birthDate}
                            gender={gender}
                            typeId={typeId}
                            patientTypes={patientTypes}
                            isTurno={isTurno}
                            entryTime={entryTime}
                            exitTime={exitTime}
                            isExtractingFromFiles={isExtractingFromFiles}
                            onExtractFromAttachments={handleExtractFromAttachmentsWrapper}
                            onNameChange={setName}
                            onNameBlur={() => setName(formatPatientName(name))}
                            onRutChange={setRut}
                            onBirthDateChange={setBirthDate}
                            onGenderChange={setGender}
                            onSelectType={(id, label) => { setTypeId(id); setType(label); }}
                            onEntryTimeChange={setEntryTime}
                            onExitTimeChange={setExitTime}
                            compact={true}
                            onSave={handleSave}
                            onClose={onClose}
                        />
                    </div>
                )}

                {initialTab === 'clinical' && (
                    <div className="w-full min-w-0 overflow-hidden">
                        <ClinicalNote
                            diagnosis={diagnosis}
                            clinicalNote={clinicalNote}
                            pendingTasks={pendingTasks}
                            isListening={isListening}
                            isAnalyzing={isAnalyzing}
                            isSummarizing={isSummarizing}
                            onDiagnosisChange={setDiagnosis}
                            onClinicalNoteChange={setClinicalNote}
                            onToggleListening={toggleListening}
                            onAnalyze={handleAIAnalysis}
                            onSummary={handleClinicalSummary}
                            onToggleTask={toggleTask}
                            onDeleteTask={deleteTask}
                            onAddTask={addTask}
                            activeTab="clinical"
                            onChangeTab={() => { }}
                            attachmentsCount={attachedFiles.length}
                            minimal={true}
                        />
                    </div>
                )}

                {initialTab === 'files' && (
                    <div className="w-full min-w-0 overflow-hidden animate-fade-in">
                        <PatientAttachmentsSection
                            attachedFiles={attachedFiles}
                            patientId={patient.id}
                            patientRut={rut}
                            patientName={name}
                            driveFolderId={driveFolderId}
                            addToast={addToast}
                            onFilesChange={setAttachedFiles}
                            onDriveFolderIdChange={setDriveFolderId}
                            compact={true}
                        />
                    </div>
                )}

                {initialTab === 'tasks' && (
                    <div className="w-full min-w-0 overflow-hidden animate-fade-in space-y-2">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 max-h-[300px]">
                            {pendingTasks.length === 0 && (
                                <p className="text-xs text-amber-600/60 text-center py-4 italic">No hay tareas pendientes</p>
                            )}
                            {pendingTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center group bg-white dark:bg-gray-800 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40 shadow-sm transition-all hover:border-amber-300"
                                >
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className="mr-3 text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                        {task.isCompleted ? <Save className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-gray-300" />}
                                    </button>
                                    <span className={`text-xs flex-1 font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {task.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3">
                            <input
                                type="text"
                                placeholder="+ Nueva tarea..."
                                onKeyDown={addTask}
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 rounded-lg border border-amber-200/50 focus:border-amber-400 outline-none shadow-sm placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                )}
            </div>

            {initialTab !== 'demographics' && (
                <div className="flex justify-end gap-2 pt-2 mt-2 border-t border-gray-50 dark:border-gray-800">
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">Cancelar</Button>
                    <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold text-xs h-8">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar
                    </Button>
                </div>
            )}
        </div>
    );
};

export default InlinePatientEditor;
