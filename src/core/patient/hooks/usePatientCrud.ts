import { useCallback } from 'react';
import { format } from 'date-fns';
import { PatientRecord } from '@shared/types';

const toTitleCase = (str: string) => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const formatDateLabel = (dateStr: string) => {
  try {
    return format(new Date(dateStr + 'T00:00:00'), 'dd-MM-yyyy');
  } catch (error) {
    return dateStr;
  }
};

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
    (patientData: any) => {
      const formattedData = {
        ...patientData,
        name: toTitleCase(patientData.name)
      };

      if (editingPatient) {
        updatePatient({ ...formattedData, id: editingPatient.id, createdAt: editingPatient.createdAt });
        addToast('success', 'Paciente actualizado');
      } else {
        const newPatient: PatientRecord = { ...formattedData, id: crypto.randomUUID(), createdAt: Date.now() };
        addPatient(newPatient);
        addToast('success', 'Nuevo paciente registrado');
      }
      setEditingPatient(null);
    },
    [addPatient, addToast, editingPatient, setEditingPatient, updatePatient]
  );

  const handleSaveMultiplePatients = useCallback(
    (patientsData: any[]) => {
      patientsData.forEach(p => {
        const newPatient: PatientRecord = {
          ...p,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          pendingTasks: p.pendingTasks || []
        };
        addPatient(newPatient);
      });
      addToast('success', `${patientsData.length} pacientes registrados`);
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
      if (!targetDate) {
        addToast('error', 'Debes seleccionar una fecha destino.');
        return;
      }

      const updatedRecords = records.map(record =>
        patientIds.includes(record.id)
          ? { ...record, date: targetDate, updatedAt: Date.now() }
          : record
      );

      setRecords(updatedRecords);
      addToast('success', `Pacientes movidos al ${formatDateLabel(targetDate)}.`);
    },
    [addToast, records, setRecords]
  );

  const handleCopyPatientsToDate = useCallback(
    (patientIds: string[], targetDate: string) => {
      if (!targetDate) {
        addToast('error', 'Debes seleccionar una fecha destino.');
        return;
      }

      const selectedPatients = records.filter(record => patientIds.includes(record.id));

      if (selectedPatients.length === 0) {
        addToast('info', 'No hay pacientes para copiar.');
        return;
      }

      const timestamp = Date.now();
      const clonedPatients = selectedPatients.map((patient, index) => ({
        ...patient,
        id: crypto.randomUUID(),
        date: targetDate,
        createdAt: timestamp + index,
        updatedAt: timestamp + index,
        pendingTasks: patient.pendingTasks?.map(task => ({ ...task, id: crypto.randomUUID() })) || [],
        attachedFiles: patient.attachedFiles?.map(file => ({ ...file, id: crypto.randomUUID() })) || [],
      }));

      setRecords([...records, ...clonedPatients]);
      addToast('success', `${clonedPatients.length} pacientes copiados al ${formatDateLabel(targetDate)}.`);
    },
    [addToast, records, setRecords]
  );

  return {
    handleSavePatient,
    handleSaveMultiplePatients,
    confirmDeletePatient,
    handleMovePatientsToDate,
    handleCopyPatientsToDate,
  } as const;
};

export default usePatientCrud;
