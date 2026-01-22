
import React, { useState, useEffect } from 'react';
import { PatientRecord, PatientType, PendingTask, AttachedFile, PatientFormData } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import ClinicalNote from '@core/patient/components/ClinicalNote';
import PatientForm from '@core/patient/components/PatientForm';
import PatientAttachmentsSection from '@core/patient/components/PatientAttachmentsSection';
import PatientModalHeader from '@core/patient/components/PatientModalHeader';
import PatientModalFooter from '@core/patient/components/PatientModalFooter';
import { formatPatientName, formatTitleCase } from '@core/patient/utils/patientUtils';
import { sanitizeClinicalNote, sanitizeDiagnosis, sanitizeRut } from '@shared/utils/sanitization';
import { usePatientVoiceAndAI } from '@core/patient';
import { usePatientDataExtraction } from '@core/patient';
import { calculateAge } from '@shared/utils/dateUtils';

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
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);

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
    setDiagnosis,
    setClinicalNote,
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
        setDiagnosis(initialData.diagnosis || '');
        setClinicalNote(initialData.clinicalNote || '');
        setPendingTasks(initialData.pendingTasks || []);
        setAttachedFiles(initialData.attachedFiles || []);
        setDriveFolderId(initialData.driveFolderId || null);
        setIsEditingDemographics(false);
      } else {
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
        setIsEditingDemographics(true);
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
    extractFromAttachments(attachedFiles, { name, rut, birthDate, gender, diagnosis, clinicalNote });
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

  const turnoTypeId = patientTypes.find(t => t.id === 'turno')?.id || 'turno';
  const isTurno = typeId === turnoTypeId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-0 md:p-6">
      <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>

      <div className="relative w-full md:max-w-4xl glass md:rounded-panel shadow-premium-xl flex flex-col h-full md:h-auto md:max-h-[92vh] overflow-hidden animate-slide-up border-white/40 dark:border-white/10">

        <PatientModalHeader
          isNewPatient={!initialData}
          name={name}
          rut={rut}
          age={calculateAge(birthDate)}
          gender={gender}
          date={initialData ? initialData.date : selectedDate}
          isEditing={isEditingDemographics}
          onEditToggle={() => setIsEditingDemographics(!isEditingDemographics)}
          isScanning={isScanning}
          isScanningMulti={isScanningMulti}
          fileInputRef={fileInputRef}
          multiFileInputRef={multiFileInputRef}
          onFileUpload={handleImageUpload}
          onMultiFileUpload={handleMultiImageUpload}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/20 dark:bg-gray-900/10">
          <div className="flex flex-col gap-0">
            {isEditingDemographics && (
              <div className="px-3 md:px-5 py-2 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 animate-fade-in shadow-inner">
                <PatientForm
                  name={name}
                  rut={rut}
                  birthDate={birthDate}
                  gender={gender}
                  typeId={typeId}
                  patientTypes={patientTypes}
                  isTurno={isTurno}
                  entryTime={entryTime}
                  exitTime={exitTime}
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
                  isExtractingFromFiles={isExtractingFromFiles}
                  onExtractFromAttachments={handleExtractFromAttachments}
                  superMinimalist={true}
                />
              </div>
            )}

            <div className="p-3 md:p-4">
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
