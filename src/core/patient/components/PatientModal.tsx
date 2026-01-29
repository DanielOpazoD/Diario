
import React from 'react';
import { PatientRecord, PatientFormData } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import PatientModalHeader from '@core/patient/components/PatientModalHeader';
import PatientModalFooter from '@core/patient/components/PatientModalFooter';
import { formatPatientName, formatTitleCase } from '@core/patient/utils/patientUtils';
import { usePatientVoiceAndAI } from '@core/patient';
import { usePatientDataExtraction } from '@core/patient';
import PatientModalBody, { buildPatientPayload } from '@core/patient/components/PatientModalBody';
import { calculateAge } from '@shared/utils/dateUtils';
import usePatientModalState from '@core/patient/hooks/usePatientModalState';
import usePendingTasks from '@core/patient/hooks/usePendingTasks';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: PatientFormData) => void;
  onSaveMultiple?: (patients: PatientFormData[]) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  initialData?: PatientRecord | null;
  selectedDate: string;
  initialTab?: 'clinical' | 'files';
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSave, onSaveMultiple, addToast, initialData, selectedDate, initialTab = 'clinical' }) => {
  const patientTypes = useAppStore(state => state.patientTypes);
  const defaultTypeId = patientTypes.find(t => t.id === 'policlinico')?.id || patientTypes[0]?.id || '';

  const {
    name,
    setName,
    rut,
    setRut,
    patientId,
    birthDate,
    setBirthDate,
    gender,
    setGender,
    type,
    setType,
    typeId,
    setTypeId,
    entryTime,
    setEntryTime,
    exitTime,
    setExitTime,
    diagnosis,
    setDiagnosis,
    clinicalNote,
    setClinicalNote,
    pendingTasks,
    setPendingTasks,
    attachedFiles,
    setAttachedFiles,
    driveFolderId,
    setDriveFolderId,
    activeTab,
    setActiveTab,
    isEditingDemographics,
    setIsEditingDemographics,
  } = usePatientModalState({
    isOpen,
    initialData,
    initialTab,
    defaultTypeId,
    patientTypes,
  });

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
    const patientToSave: PatientFormData = buildPatientPayload({
      initialData,
      selectedDate,
      patientTypes,
      name,
      rut,
      birthDate,
      gender,
      type,
      typeId,
      entryTime,
      exitTime,
      diagnosis,
      clinicalNote,
      pendingTasks,
      attachedFiles,
      patientId,
      driveFolderId,
    });
    onSave(patientToSave);
    onClose();
  };

  const { toggleTask, deleteTask, addTask } = usePendingTasks({ setPendingTasks });

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

        <PatientModalBody
          patientTypes={patientTypes}
          isEditingDemographics={isEditingDemographics}
          activeTab={activeTab}
          name={name}
          rut={rut}
          birthDate={birthDate}
          gender={gender}
          typeId={typeId}
          entryTime={entryTime}
          exitTime={exitTime}
          diagnosis={diagnosis}
          clinicalNote={clinicalNote}
          pendingTasks={pendingTasks}
          attachedFiles={attachedFiles}
          patientId={patientId}
          driveFolderId={driveFolderId}
          isTurno={isTurno}
          isListening={isListening}
          isAnalyzing={isAnalyzing}
          isSummarizing={isSummarizing}
          isExtractingFromFiles={isExtractingFromFiles}
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
          onExtractFromAttachments={handleExtractFromAttachments}
          onDiagnosisChange={setDiagnosis}
          onClinicalNoteChange={setClinicalNote}
          onToggleListening={toggleListening}
          onAnalyze={handleAIAnalysis}
          onSummary={handleClinicalSummary}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onAddTask={addTask}
          onChangeTab={setActiveTab}
          onFilesChange={setAttachedFiles}
          onDriveFolderIdChange={setDriveFolderId}
          addToast={addToast}
        />

        <PatientModalFooter onCancel={onClose} onSave={handleSave} />
      </div>
    </div>
  );
};

export { formatTitleCase, formatPatientName };

export default PatientModal;
