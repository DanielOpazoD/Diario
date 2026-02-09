
import React, { useCallback, useMemo } from 'react';
import { PatientCreateInput, PatientRecord, PatientUpdateInput } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';
import PatientModalHeader from '@core/patient/components/PatientModalHeader';
import PatientModalFooter from '@core/patient/components/PatientModalFooter';
import { sanitizePatientName } from '@use-cases/patient/sanitizeFields';
import { isPatientNameValid } from '@use-cases/patient/validation';
import { usePatientVoiceAndAI } from '@core/patient';
import { usePatientDataExtraction } from '@core/patient';
import PatientModalBody from '@core/patient/components/PatientModalBody';
import { buildPatientPayload } from '@use-cases/patient/buildPayload';
import { patientPayloadFingerprint } from '@use-cases/patient/fingerprint';
import { calculateAge } from '@shared/utils/dateUtils';
import usePatientModalState from '@core/patient/hooks/usePatientModalState';
import usePendingTasks from '@core/patient/hooks/usePendingTasks';
export { formatTitleCase } from '@shared/utils/patientUtils';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: PatientCreateInput | PatientUpdateInput) => void;
  onAutoSave: (patient: PatientCreateInput | PatientUpdateInput) => void;
  onSaveMultiple?: (patients: PatientCreateInput[]) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  initialData?: PatientRecord | null;
  selectedDate: string;
  initialTab?: 'clinical' | 'files';
  mode?: 'daily' | 'history';
}

const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAutoSave,
  onSaveMultiple,
  addToast,
  initialData,
  selectedDate,
  initialTab = 'clinical',
  mode = 'daily',
}) => {
  const patientTypes = useAppStore(state => state.patientTypes);
  const defaultTypeId = useMemo(
    () => patientTypes.find(t => t.id === 'policlinico')?.id || patientTypes[0]?.id || '',
    [patientTypes]
  );

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

  const handleNameBlur = useCallback(() => {
    if (name) {
      setName(sanitizePatientName(name));
    }
  }, [name, setName]);

  const handleExtractFromAttachments = useCallback(() => {
    extractFromAttachments(attachedFiles, { name, rut, birthDate, gender, diagnosis, clinicalNote });
  }, [attachedFiles, birthDate, clinicalNote, diagnosis, extractFromAttachments, gender, name, rut]);

  const autoSaveInitialized = React.useRef(false);
  const lastAutoSaveRef = React.useRef<string | null>(null);
  const handleAutoSave = useCallback(() => {
    if (!isPatientNameValid(name)) return;
    const patientToSave = buildPatientPayload({
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
    onAutoSave(patientToSave);
  }, [
    attachedFiles,
    birthDate,
    clinicalNote,
    diagnosis,
    driveFolderId,
    entryTime,
    exitTime,
    gender,
    initialData,
    name,
    onAutoSave,
    patientId,
    patientTypes,
    pendingTasks,
    rut,
    selectedDate,
    type,
    typeId,
  ]);

  const getAutoSaveFingerprint = React.useCallback(() => {
    const payload = buildPatientPayload({
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
    }) as PatientCreateInput | PatientUpdateInput;

    return patientPayloadFingerprint(payload, patientId);
  }, [
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
  ]);

  const handleSave = useCallback(() => {
    if (!isPatientNameValid(name)) return addToast('error', 'Nombre requerido');
    const patientToSave = buildPatientPayload({
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
  }, [
    addToast,
    attachedFiles,
    birthDate,
    clinicalNote,
    diagnosis,
    driveFolderId,
    entryTime,
    exitTime,
    gender,
    initialData,
    name,
    onClose,
    onSave,
    patientId,
    patientTypes,
    pendingTasks,
    rut,
    selectedDate,
    type,
    typeId,
  ]);

  React.useEffect(() => {
    if (!isOpen || mode === 'history') return;
    if (!autoSaveInitialized.current) {
      autoSaveInitialized.current = true;
      lastAutoSaveRef.current = getAutoSaveFingerprint();
      return;
    }
    const nextFingerprint = getAutoSaveFingerprint();
    if (lastAutoSaveRef.current === nextFingerprint) return;
    const timeout = setTimeout(() => {
      lastAutoSaveRef.current = nextFingerprint;
      handleAutoSave();
    }, 600);
    return () => clearTimeout(timeout);
  }, [
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
    driveFolderId,
    isOpen,
    mode,
    getAutoSaveFingerprint,
    handleAutoSave,
  ]);

  React.useEffect(() => {
    if (!isOpen) {
      autoSaveInitialized.current = false;
      lastAutoSaveRef.current = null;
    }
  }, [isOpen]);

  const { toggleTask, deleteTask, addTask, updateTaskNote } = usePendingTasks({ setPendingTasks });

  const handleEditToggle = useCallback(() => {
    setIsEditingDemographics(prev => !prev);
  }, [setIsEditingDemographics]);

  const handleSelectType = useCallback((typeIdValue: string, typeLabel: string) => {
    setType(typeLabel);
    setTypeId(typeIdValue);
  }, [setType, setTypeId]);

  const handleChangeTab = useCallback((tab: 'clinical' | 'files') => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const turnoTypeId = useMemo(
    () => patientTypes.find(t => t.id === 'turno')?.id || 'turno',
    [patientTypes]
  );
  const isTurno = useMemo(() => typeId === turnoTypeId, [typeId, turnoTypeId]);

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
          onEditToggle={handleEditToggle}
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
          onSelectType={handleSelectType}
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
          onUpdateTaskNote={updateTaskNote}
          onChangeTab={handleChangeTab}
          onFilesChange={setAttachedFiles}
          onDriveFolderIdChange={setDriveFolderId}
          addToast={addToast}
        />

        <PatientModalFooter
          onCancel={onClose}
          onSave={handleSave}
          showSave={false}
        />
      </div>
    </div>
  );
};

export default React.memo(PatientModal);
