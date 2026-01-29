import { useCallback } from 'react';
import { PatientRecord, PatientCreateInput, PatientUpdateInput } from '@shared/types';
import {
  savePatient,
  savePatientsBatch,
  movePatientsToDate,
  copyPatientsToDate,
} from '@use-cases/patients';

interface UsePatientCrudParams {
  records: PatientRecord[];
  editingPatient: PatientRecord | null;
  patientToDelete: string | null;
  setEditingPatient: (patient: PatientRecord | null) => void;
  setPatientToDelete: (patientId: string | null) => void;
  setRecords: (records: PatientRecord[]) => void;
  addPatient: (patient: PatientRecord) => void;
  updatePatient: (patient: PatientRecord) => void;
  deletePatient: (patientId: string) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const usePatientCrud = ({
  records,
  editingPatient,
  patientToDelete,
  setEditingPatient,
  setPatientToDelete,
  setRecords,
  addPatient,
  updatePatient,
  deletePatient,
  addToast,
}: UsePatientCrudParams) => {
  const handleSavePatient = useCallback(
    (patientData: PatientCreateInput | PatientUpdateInput) => {
      const patientId = (patientData as PatientRecord).id;
      const existing = editingPatient || records.find((record) => record.id === patientId) || null;
      const result = savePatient(patientData, existing);

      if (result.isUpdate) {
        updatePatient(result.patient);
      } else {
        addPatient(result.patient);
      }
      addToast('success', result.message);
      setEditingPatient(null);
    },
    [addPatient, addToast, editingPatient, records, setEditingPatient, updatePatient]
  );

  const handleAutoSavePatient = useCallback(
    (patientData: PatientCreateInput | PatientUpdateInput) => {
      const patientId = (patientData as PatientRecord).id;
      const existing = editingPatient || records.find((record) => record.id === patientId) || null;
      const result = savePatient(patientData, existing);

      if (result.isUpdate) {
        updatePatient(result.patient);
      } else {
        addPatient(result.patient);
      }
    },
    [addPatient, editingPatient, records, updatePatient]
  );

  const handleSaveMultiplePatients = useCallback(
    (patientsData: PatientCreateInput[]) => {
      const newPatients = savePatientsBatch(patientsData);
      newPatients.forEach(addPatient);
      addToast('success', `${newPatients.length} pacientes registrados`);
    },
    [addPatient, addToast]
  );

  const confirmDeletePatient = useCallback(() => {
    if (patientToDelete) {
      deletePatient(patientToDelete);
      addToast('info', 'Registro eliminado');
      setPatientToDelete(null);
    }
  }, [addToast, deletePatient, patientToDelete, setPatientToDelete]);

  const handleMovePatientsToDate = useCallback(
    (patientIds: string[], targetDate: string) => {
      const result = movePatientsToDate(records, patientIds, targetDate);
      if (result.records) {
        setRecords(result.records);
      }
      addToast(result.level, result.message);
    },
    [addToast, records, setRecords]
  );

  const handleCopyPatientsToDate = useCallback(
    (patientIds: string[], targetDate: string) => {
      const result = copyPatientsToDate(records, patientIds, targetDate);
      if (result.records) {
        setRecords(result.records);
      }
      addToast(result.level, result.message);
    },
    [addToast, records, setRecords]
  );

  return {
    handleSavePatient,
    handleAutoSavePatient,
    handleSaveMultiplePatients,
    confirmDeletePatient,
    handleMovePatientsToDate,
    handleCopyPatientsToDate,
  } as const;
};

export default usePatientCrud;
