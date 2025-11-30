import { useEffect, useState } from 'react';
import { AttachedFile, PatientRecord, PatientType, PendingTask } from '../../../shared/types/index.ts';

interface UsePatientFormParams {
  initialData?: PatientRecord | null;
  isOpen: boolean;
}

export const usePatientForm = ({ initialData, isOpen }: UsePatientFormParams) => {
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [type, setType] = useState<string>(PatientType.POLICLINICO);
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'clinical' | 'files'>('clinical');

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name);
      setRut(initialData.rut);
      setBirthDate(initialData.birthDate || '');
      setGender(initialData.gender || '');
      setType(initialData.type);
      setEntryTime(initialData.entryTime || '');
      setExitTime(initialData.exitTime || '');
      setDiagnosis(initialData.diagnosis);
      setClinicalNote(initialData.clinicalNote);
      setPendingTasks(initialData.pendingTasks);
      setAttachedFiles(initialData.attachedFiles || []);
    } else {
      setName('');
      setRut('');
      setBirthDate('');
      setGender('');
      setType(PatientType.POLICLINICO);
      setEntryTime('');
      setExitTime('');
      setDiagnosis('');
      setClinicalNote('');
      setPendingTasks([]);
      setAttachedFiles([]);
    }

    setActiveTab('clinical');
  }, [initialData, isOpen]);

  return {
    name,
    rut,
    birthDate,
    gender,
    type,
    entryTime,
    exitTime,
    diagnosis,
    clinicalNote,
    pendingTasks,
    attachedFiles,
    activeTab,
    setName,
    setRut,
    setBirthDate,
    setGender,
    setType,
    setEntryTime,
    setExitTime,
    setDiagnosis,
    setClinicalNote,
    setPendingTasks,
    setAttachedFiles,
    setActiveTab,
  };
};

export default usePatientForm;
