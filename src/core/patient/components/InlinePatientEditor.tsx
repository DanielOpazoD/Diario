import React, { useEffect, useRef, useState } from 'react';
import { Save, X } from 'lucide-react';
import { PatientRecord, AttachedFile } from '@shared/types';
import { Button } from '@core/ui';
import useAppStore from '@core/stores/useAppStore';
import InlinePatientDemographics from '@core/patient/components/InlinePatientDemographics';
import InlinePatientClinical from '@core/patient/components/InlinePatientClinical';
import InlinePatientFiles from '@core/patient/components/InlinePatientFiles';
import InlinePatientTasks from '@core/patient/components/InlinePatientTasks';
import { formatPatientName } from '@core/patient/utils/patientUtils';
import { sanitizeClinicalNote, sanitizeDiagnosis, sanitizeRut } from '@shared/utils/sanitization';
import { usePatientVoiceAndAI } from '@core/patient';
import { usePatientDataExtraction } from '@core/patient';
import usePendingTasks from '@core/patient/hooks/usePendingTasks';

interface InlinePatientEditorProps {
    patient: PatientRecord;
    initialTab: 'demographics' | 'clinical' | 'files' | 'tasks';
    onClose: () => void;
    onSave: (patient: PatientRecord) => void;
    onAutoSave?: (patient: PatientRecord) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
    selectedDate: string;
}

const InlinePatientEditor: React.FC<InlinePatientEditorProps> = ({
    patient,
    initialTab,
    onClose,
    onSave,
    onAutoSave,
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
    const [pendingTasks, setPendingTasks] = useState(patient.pendingTasks || []);
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
        setDiagnosis,
        setClinicalNote,
    });

    const buildUpdatedPatient = () => {
        const finalName = formatPatientName(name);
        const selectedType = patientTypes.find(t => t.id === typeId);

        return {
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
    };

    const handleSave = () => {
        if (!name.trim()) return addToast('error', 'Nombre requerido');
        onSave(buildUpdatedPatient());
    };

    const autoSaveInitialized = useRef(false);
    useEffect(() => {
        if (!onAutoSave) return;
        if (!autoSaveInitialized.current) {
            autoSaveInitialized.current = true;
            return;
        }
        onAutoSave(buildUpdatedPatient());
    }, [pendingTasks, attachedFiles, driveFolderId, onAutoSave]);

    const handleExtractFromAttachmentsWrapper = () => {
        handleExtractFromAttachments(attachedFiles, { name, rut, birthDate, gender, diagnosis, clinicalNote });
    };

    const handleExtractFromAttachment = (attachmentId: string) => {
        const target = attachedFiles.find(file => file.id === attachmentId);
        if (!target) {
            addToast('info', 'No se encontró el adjunto seleccionado.');
            return;
        }
        handleExtractFromAttachments([target], { name, rut, birthDate, gender, diagnosis, clinicalNote });
    };

    const { toggleTask, deleteTask, addTask, updateTaskNote } = usePendingTasks({ setPendingTasks });

    // Render Helpers
    const isTurno = typeId === (patientTypes.find(t => t.id === 'turno')?.id || 'turno');

    return (
        <div className={`bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-inner px-4 ${initialTab === 'demographics' ? 'py-0 overflow-hidden' : 'py-1 overflow-hidden'} animate-slide-down w-full max-w-full min-w-0`}>
            <div className={`flex justify-end items-center ${initialTab === 'demographics' ? 'h-0 opacity-0 overflow-hidden' : ''}`}>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
            </div>

            <div className="w-full max-w-full min-w-0 overflow-hidden">
                {initialTab === 'demographics' && (
                    <InlinePatientDemographics
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
                        attachedFiles={attachedFiles}
                        onExtractFromAttachment={handleExtractFromAttachment}
                        onNameChange={setName}
                        onNameBlur={() => setName(formatPatientName(name))}
                        onRutChange={setRut}
                        onBirthDateChange={setBirthDate}
                        onGenderChange={setGender}
                        onSelectType={(id: string, label: string) => { setTypeId(id); setType(label); }}
                        onEntryTimeChange={setEntryTime}
                        onExitTimeChange={setExitTime}
                        onSave={handleSave}
                        onClose={onClose}
                    />
                )}

                {initialTab === 'clinical' && (
                    <InlinePatientClinical
                        diagnosis={diagnosis}
                        clinicalNote={clinicalNote}
                        pendingTasks={pendingTasks}
                        isListening={isListening}
                        isAnalyzing={isAnalyzing}
                        isSummarizing={isSummarizing}
                        attachmentsCount={attachedFiles.length}
                        onDiagnosisChange={setDiagnosis}
                        onClinicalNoteChange={setClinicalNote}
                        onToggleListening={toggleListening}
                        onAnalyze={handleAIAnalysis}
                        onSummary={handleClinicalSummary}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        onAddTask={addTask}
                        onUpdateTaskNote={updateTaskNote}
                    />
                )}

                {initialTab === 'files' && (
                    <InlinePatientFiles
                        attachedFiles={attachedFiles}
                        patientId={patient.id}
                        patientRut={rut}
                        patientName={name}
                        driveFolderId={driveFolderId}
                        addToast={addToast}
                        onFilesChange={setAttachedFiles}
                        onDriveFolderIdChange={setDriveFolderId}
                    />
                )}

                {initialTab === 'tasks' && (
                    <InlinePatientTasks
                        pendingTasks={pendingTasks}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        onAddTask={addTask}
                        onUpdateTaskNote={updateTaskNote}
                    />
                )}
            </div>

            {initialTab === 'clinical' && (
                <div className="flex justify-end gap-2 pt-2 mt-2 border-t border-gray-50 dark:border-gray-800">
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">Cancelar</Button>
                    <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold text-xs h-7">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar
                    </Button>
                </div>
            )}
        </div>
    );
};

export default InlinePatientEditor;
