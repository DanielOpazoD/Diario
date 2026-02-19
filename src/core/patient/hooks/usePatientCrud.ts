import { useCallback } from 'react';
import { PatientRecord, PatientCreateInput, PatientUpdateInput } from '@shared/types';
import { movePatients } from '@use-cases/patient/move';
import { copyPatients } from '@use-cases/patient/copy';
import { deletePatientWithSync } from '@use-cases/patient/delete';
import { useRecords, useModalState } from '@core/app/state/useAppState';
import { useAppActions } from '@core/app/state/useAppActions';
import { PatientRepository } from '@core/patient/repository/PatientRepository';

const usePatientCrud = () => {
  const records = useRecords();
  const { editingPatient, patientToDelete } = useModalState();
  const {
    setRecords,
    addPatient,
    updatePatient,
    deletePatient,
    addToast,
    closePatientModal,
    closeDeleteConfirmation,
  } = useAppActions();

  const handleSavePatient = useCallback(
    (patientData: PatientCreateInput | PatientUpdateInput) => {
      const patientId = (patientData as PatientRecord).id;
      const existing = editingPatient || records.find((record) => record.id === patientId) || null;

      let result;
      if (existing) {
        result = PatientRepository.update(existing, patientData as PatientUpdateInput);
      } else {
        result = PatientRepository.create(patientData as PatientCreateInput);
      }

      if (!result.success) {
        addToast('error', `Error de validación: ${result.error}`);
        return;
      }

      if (existing) {
        updatePatient(result.data);
        addToast('success', 'Paciente actualizado');
      } else {
        addPatient(result.data);
        addToast('success', 'Nuevo paciente registrado');
      }

      closePatientModal();
    },
    [addPatient, addToast, closePatientModal, editingPatient, records, updatePatient]
  );

  const handleAutoSavePatient = useCallback(
    (patientData: PatientCreateInput | PatientUpdateInput) => {
      const patientId = (patientData as PatientRecord).id;
      const existing = editingPatient || (patientId ? records.find((record) => record.id === patientId) : null) || null;

      let result;
      if (existing) {
        result = PatientRepository.update(existing, patientData as PatientUpdateInput);
      } else {
        result = PatientRepository.create(patientData as PatientCreateInput);
      }

      if (result.success) {
        if (existing) {
          updatePatient(result.data);
        } else {
          addPatient(result.data);
        }
      }
    },
    [addPatient, editingPatient, records, updatePatient]
  );

  const handleSaveMultiplePatients = useCallback(
    (patientsData: PatientCreateInput[]) => {
      const validPatients: PatientRecord[] = [];
      const errors: string[] = [];

      patientsData.forEach((data, index) => {
        const result = PatientRepository.create(data);
        if (result.success) {
          validPatients.push(result.data);
        } else {
          errors.push(`Paciente ${index + 1}: ${result.error}`);
        }
      });

      validPatients.forEach(addPatient);

      if (validPatients.length > 0) {
        addToast('success', `${validPatients.length} pacientes registrados`);
      }

      if (errors.length > 0) {
        addToast('error', `Errores en ${errors.length} registros: ${errors[0]}`);
      }
    },
    [addPatient, addToast]
  );

  const confirmDeletePatient = useCallback(() => {
    if (patientToDelete) {
      deletePatient(patientToDelete);
      deletePatientWithSync(patientToDelete).catch(() => undefined);
      addToast('info', 'Registro eliminado');
      closeDeleteConfirmation();
    }
  }, [addToast, deletePatient, patientToDelete, closeDeleteConfirmation]);

  const handleMovePatientsToDate = useCallback(
    (patientIds: string[], targetDate: string) => {
      const result = movePatients(records, patientIds, targetDate);
      if (result.records) {
        setRecords(result.records);
      }
      addToast(result.level, result.message);
    },
    [addToast, records, setRecords]
  );

  const handleCopyPatientsToDate = useCallback(
    (patientIds: string[], targetDate: string) => {
      const result = copyPatients(records, patientIds, targetDate);
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
