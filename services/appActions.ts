import { generateHandoverReport } from './reportService';
import { uploadFileToDrive, downloadFile, getActiveAccessToken, clearStoredToken } from './googleService';
import { parseUploadedJson } from './storage';
import { DriveFolderPreference, PatientRecord } from '../types';

const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

interface AppActionsDependencies {
  addPatient: (patient: PatientRecord) => void;
  updatePatient: (patient: PatientRecord) => void;
  deletePatient: (id: string) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  setRecords: (records: PatientRecord[]) => void;
  setGeneralTasks: (tasks: any) => void;
  generalTasks: any;
  patientTypes: any;
  records: PatientRecord[];
  user: { name?: string } | null;
  logout: () => void;
}

export function createAppActions(dependencies: AppActionsDependencies) {
  const {
    addPatient,
    updatePatient,
    deletePatient,
    addToast,
    setRecords,
    setGeneralTasks,
    generalTasks,
    patientTypes,
    records,
    user,
    logout,
  } = dependencies;

  const savePatient = (patientData: any, editingPatient: PatientRecord | null) => {
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
  };

  const saveMultiplePatients = (patientsData: any[]) => {
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
  };

  const deletePatientById = (patientId: string | null) => {
    if (!patientId) return false;
    deletePatient(patientId);
    addToast('info', 'Registro eliminado');
    return true;
  };

  const importLocalBackup = async (file: File, setIsUploading: (value: boolean) => void) => {
    setIsUploading(true);
    try {
      const importedRecords = await parseUploadedJson(file);
      setRecords(importedRecords);
      addToast('success', 'Base de datos local restaurada');
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al leer el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const generatePdfReport = (dailyRecords: PatientRecord[], currentDate: Date) => {
    generateHandoverReport(dailyRecords, currentDate, user?.name || 'Dr.');
    addToast('success', 'PDF Generado');
  };

  const backupToDrive = async (
    fileName: string,
    folder: DriveFolderPreference,
    setIsUploading: (value: boolean) => void,
    onComplete?: () => void,
  ) => {
    const token = getActiveAccessToken();
    if (!token) {
      addToast('error', 'No hay sesión de Google activa.');
      return;
    }
    setIsUploading(true);
    try {
      const backupData = {
        patients: records,
        generalTasks: generalTasks,
        patientTypes: patientTypes
      };
      const finalName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
      await uploadFileToDrive(JSON.stringify(backupData, null, 2), finalName, token, folder.name, folder.id);
      addToast('success', `Respaldo guardado en carpeta "${folder.name}"`);
      onComplete?.();
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al subir a Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const restoreBackupFromDrive = async (
    fileId: string,
    setIsUploading: (value: boolean) => void,
    onComplete?: () => void,
  ) => {
    const token = getActiveAccessToken();
    if (!token) return;

    setIsUploading(true);
    try {
      const data = await downloadFile(fileId, token);

      if (data.patients && Array.isArray(data.patients)) {
        setRecords(data.patients);
        if (data.generalTasks) setGeneralTasks(data.generalTasks);
        addToast('success', 'Respaldo restaurado exitosamente');
        onComplete?.();
      } else if (Array.isArray(data)) {
        setRecords(data);
        addToast('success', 'Respaldo (formato antiguo) restaurado');
        onComplete?.();
      } else {
        throw new Error('Formato de archivo no reconocido');
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al restaurar desde Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const logoutUser = () => {
    clearStoredToken();
    logout();
  };

  return {
    savePatient,
    saveMultiplePatients,
    deletePatientById,
    importLocalBackup,
    generatePdfReport,
    backupToDrive,
    restoreBackupFromDrive,
    logoutUser,
  };
}

export default createAppActions;
