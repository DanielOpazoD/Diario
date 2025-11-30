import { useEffect, useState } from 'react';
import { AttachedFile, PatientRecord, PatientType, PendingTask } from '../../../shared/types';

interface UsePatientFormOptions {
  initialData?: PatientRecord | null;
  isOpen: boolean;
  selectedDate: string;
}

const usePatientForm = ({ initialData, isOpen, selectedDate }: UsePatientFormOptions) => {
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

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, initialData, selectedDate]);

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
  };
};

export default usePatientForm;
