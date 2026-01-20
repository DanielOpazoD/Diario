
import React, { useState, useEffect } from 'react';
import { PatientRecord, PatientType, PendingTask, AttachedFile, PatientFormData } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import ClinicalNote from '@core/patient/components/ClinicalNote';
import PatientIdentificationPanel from '@core/patient/components/PatientIdentificationPanel';
import PatientAttachmentsSection from '@core/patient/components/PatientAttachmentsSection';
import PatientModalHeader from '@core/patient/components/PatientModalHeader';
import PatientModalFooter from '@core/patient/components/PatientModalFooter';
import { formatPatientName, formatTitleCase } from '@core/patient/utils/patientUtils';
import { sanitizeClinicalNote, sanitizeDiagnosis, sanitizeRut } from '@shared/utils/sanitization';
import { usePatientVoiceAndAI } from '@core/patient';
import { usePatientDataExtraction } from '@core/patient';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: PatientFormData) => void;
  onSaveMultiple?: (patients: Array<Omit<PatientRecord, 'id' | 'createdAt'>>) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  initialData?: PatientRecord | null;
  selectedDate: string;
  initialTab?: 'clinical' | 'files';
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSave, onSaveMultiple, addToast, initialData, selectedDate, initialTab = 'clinical' }) => {
  const patientTypes = useAppStore(state => state.patientTypes);

  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [patientId, setPatientId] = useState<string>('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const defaultTypeId = patientTypes.find(t => t.id === 'policlinico')?.id || patientTypes[0]?.id || '';
  const [type, setType] = useState<string>(PatientType.POLICLINICO);
  const [typeId, setTypeId] = useState<string>(defaultTypeId);
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'clinical' | 'files'>('clinical');

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
    fileInputRef,
    multiFileInputRef,
    isScanning,
    isScanningMulti,
    isExtractingFromFiles,
    handleImageUpload,
    handleMultiImageUpload,
    handleExtractFromAttachments: extractFromAttachments,
  } = usePatientDataExtraction({
    addToast,
    selectedDate,
    onClose,
    onSaveMultiple,
    setName,
    setRut,
    setBirthDate,
    setGender,
  });

  // Reset form strictly when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPatientId(initialData.id);
        setName(initialData.name);
        setRut(initialData.rut);
        setBirthDate(initialData.birthDate || '');
        setGender(initialData.gender || '');
        setType(initialData.type);
        const resolvedTypeId = initialData.typeId
          || patientTypes.find(t => t.label === initialData.type)?.id
          || defaultTypeId;
        setTypeId(resolvedTypeId);
        setEntryTime(initialData.entryTime || '');
        setExitTime(initialData.exitTime || '');
        setDiagnosis(initialData.diagnosis);
        setClinicalNote(initialData.clinicalNote);
        setPendingTasks(initialData.pendingTasks);
        setAttachedFiles(initialData.attachedFiles || []);
        setDriveFolderId(initialData.driveFolderId || null);
      } else {
        // Always start from zero for new patient
        setPatientId(crypto.randomUUID());
        setName('');
        setRut('');
        setBirthDate('');
        setGender('');
        setType(PatientType.POLICLINICO);
        setTypeId(defaultTypeId);
        setEntryTime('');
        setExitTime('');
        setDiagnosis('');
        setClinicalNote('');
        setPendingTasks([]);
        setAttachedFiles([]);
        setDriveFolderId(null);
      }
      setActiveTab(initialTab);
    }
  }, [isOpen, initialData, initialTab]);

  const handleNameBlur = () => {
    if (name) {
      setName(formatPatientName(name));
    }
  };

  const handleExtractFromAttachments = () => {
    extractFromAttachments(attachedFiles, { name, rut, birthDate, gender });
  };

  const handleSave = () => {
    if (!name.trim()) return addToast('error', 'Nombre requerido');
    const finalName = formatPatientName(name);
    const selectedType = patientTypes.find(t => t.id === typeId);
    const patientToSave: PatientFormData = {
      ...(initialData || {}),
      id: patientId,
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
      driveFolderId,
      date: initialData ? initialData.date : selectedDate,
      createdAt: initialData?.createdAt,
    };
    onSave(patientToSave);
    onClose();
  };

  const toggleTask = (id: string) => { setPendingTasks(tasks => tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)); };
  const deleteTask = (id: string) => { setPendingTasks(tasks => tasks.filter(t => t.id !== id)); };
  const addTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), text: e.currentTarget.value, isCompleted: false }]);
      e.currentTarget.value = '';
    }
  };

  // Explicitly check for 'Turno' type to toggle entry/exit times
  const turnoTypeId = patientTypes.find(t => t.id === 'turno')?.id || 'turno';
  const isTurno = typeId === turnoTypeId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Container - Full screen on mobile, centered on desktop */}
      <div className="relative w-full md:max-w-4xl bg-white dark:bg-gray-800 md:rounded-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[95vh] overflow-hidden animate-slide-up border border-gray-200 dark:border-gray-700">

        <PatientModalHeader
          title={initialData ? 'Editar Paciente' : 'Nuevo Ingreso'}
          subtitle={initialData ? initialData.date : selectedDate}
          isNewPatient={!initialData}
          isScanning={isScanning}
          isScanningMulti={isScanningMulti}
          fileInputRef={fileInputRef}
          multiFileInputRef={multiFileInputRef}
          onFileUpload={handleImageUpload}
          onMultiFileUpload={handleMultiImageUpload}
          onClose={onClose}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
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
              onExtractFromAttachments={handleExtractFromAttachments}
              onNameChange={setName}
              onNameBlur={handleNameBlur}
              onRutChange={setRut}
              onBirthDateChange={setBirthDate}
              onGenderChange={setGender}
              onSelectType={(typeIdValue, typeLabel) => {
                setType(typeLabel);
                setTypeId(typeIdValue);
              }}
              onEntryTimeChange={setEntryTime}
              onExitTimeChange={setExitTime}
            />

            <div className="md:col-span-8 flex flex-col h-full">
              <ClinicalNote
                diagnosis={diagnosis}
                clinicalNote={clinicalNote}
                pendingTasks={pendingTasks}
                isListening={isListening}
                isAnalyzing={isAnalyzing}
                activeTab={activeTab}
                attachmentsCount={attachedFiles.length}
                onDiagnosisChange={setDiagnosis}
                onClinicalNoteChange={setClinicalNote}
                onToggleListening={toggleListening}
                onAnalyze={handleAIAnalysis}
                onSummary={handleClinicalSummary}
                isSummarizing={isSummarizing}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
                onAddTask={addTask}
                onChangeTab={setActiveTab}
                attachmentsSection={(
                  <PatientAttachmentsSection
                    attachedFiles={attachedFiles}
                    patientId={patientId}
                    patientRut={rut}
                    patientName={name}
                    driveFolderId={driveFolderId}
                    addToast={addToast}
                    onFilesChange={setAttachedFiles}
                    onDriveFolderIdChange={setDriveFolderId}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <PatientModalFooter onCancel={onClose} onSave={handleSave} />
      </div>
    </div>
  );
};

export { formatTitleCase, formatPatientName };

export default PatientModal;
