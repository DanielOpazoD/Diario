import { useEffect, useMemo, useState } from 'react';
import { AttachedFile, PatientRecord, PatientType, PatientTypeConfig, PendingTask } from '@shared/types';

interface UsePatientModalStateParams {
  isOpen: boolean;
  initialData?: PatientRecord | null;
  initialTab: 'clinical' | 'files';
  defaultTypeId: string;
  patientTypes: PatientTypeConfig[];
}

const usePatientModalState = ({
  isOpen,
  initialData,
  initialTab,
  defaultTypeId,
  patientTypes,
}: UsePatientModalStateParams) => {
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [patientId, setPatientId] = useState<string>('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [type, setType] = useState<string>(PatientType.POLICLINICO);
  const [typeId, setTypeId] = useState<string>(defaultTypeId);
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clinical' | 'files'>(initialTab);
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);

  const resolvedTypeId = useMemo(() => {
    if (!initialData) return defaultTypeId;
    return initialData.typeId
      || patientTypes.find(t => t.label === initialData.type)?.id
      || defaultTypeId;
  }, [defaultTypeId, initialData, patientTypes]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setPatientId(initialData.id);
      setName(initialData.name);
      setRut(initialData.rut);
      setBirthDate(initialData.birthDate || '');
      setGender(initialData.gender || '');
      setType(initialData.type);
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
  }, [isOpen, initialData, initialTab, defaultTypeId, resolvedTypeId]);

  return {
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
  };
};

export default usePatientModalState;
