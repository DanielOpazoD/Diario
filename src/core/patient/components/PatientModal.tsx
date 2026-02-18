import React, { useCallback } from 'react';
import { PatientCreateInput, PatientRecord, PatientUpdateInput } from '@shared/types';
import PatientModalHeader from '@core/patient/components/PatientModalHeader';
import PatientModalFooter from '@core/patient/components/PatientModalFooter';
import { isPatientNameValid } from '@use-cases/patient/validation';
import PatientModalBody from '@core/patient/components/PatientModalBody';
import { buildPatientPayload } from '@use-cases/patient/buildPayload';
import { patientPayloadFingerprint } from '@use-cases/patient/fingerprint';
import { calculateAge } from '@shared/utils/dateUtils';
import { PatientModalProvider, usePatientModalContext } from '@core/patient/context/PatientModalContext';

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
  headerSlot?: React.ReactNode;
  bodySlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

const PatientModalContent: React.FC<PatientModalProps> = ({
  onClose,
  onSave,
  onAutoSave,
  addToast,
  initialData,
  selectedDate,
  mode = 'daily',
  headerSlot,
  bodySlot,
  footerSlot,
}) => {
  const {
    name, rut, birthDate, gender, type, typeId, entryTime, exitTime,
    diagnosis, clinicalNote, pendingTasks, attachedFiles, patientId,
    driveFolderId, isEditingDemographics, setIsEditingDemographics,
    patientTypes, isScanning, isScanningMulti, fileInputRef, multiFileInputRef,
    handleImageUpload, handleMultiImageUpload, isOpen
  } = usePatientModalContext();

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

  const getAutoSaveFingerprint = useCallback(() => {
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

  const autoSaveInitialized = React.useRef(false);
  const lastAutoSaveRef = React.useRef<string | null>(null);

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

  const handleEditToggle = useCallback(() => {
    setIsEditingDemographics(prev => !prev);
  }, [setIsEditingDemographics]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-0 md:p-6">
      <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>

      <div className="relative w-full md:max-w-4xl glass md:rounded-panel shadow-premium-xl flex flex-col h-full md:h-auto md:max-h-[92vh] overflow-hidden animate-slide-up border-white/40 dark:border-white/10">

        {headerSlot || (
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
        )}

        {bodySlot || <PatientModalBody />}

        {footerSlot || (
          <PatientModalFooter
            onCancel={onClose}
            onSave={handleSave}
            showSave={false}
          />
        )}
      </div>
    </div>
  );
};

const PatientModal: React.FC<PatientModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <PatientModalProvider
      isOpen={props.isOpen}
      initialData={props.initialData}
      selectedDate={props.selectedDate}
      initialTab={props.initialTab}
      onClose={props.onClose}
      onSaveMultiple={props.onSaveMultiple}
      addToast={props.addToast}
    >
      <PatientModalContent {...props} />
    </PatientModalProvider>
  );
};

export default React.memo(PatientModal);
