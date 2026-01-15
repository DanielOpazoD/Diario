import type React from 'react';
import { useCallback, useState } from 'react';
import { DriveFolderPreference, PatientRecord, PatientTypeConfig } from '../types';
import { defaultBookmarkCategories } from '../stores/slices/bookmarkSlice';

const loadGoogleService = () => import('../services/googleService');
const loadStorageService = () => import('../services/storage');

interface UseBackupManagerParams {
  records: PatientRecord[];
  generalTasks: any[];
  patientTypes: PatientTypeConfig[];
  bookmarks: any[];
  bookmarkCategories: any[];
  setRecords: (records: PatientRecord[]) => void;
  setGeneralTasks: (tasks: any[]) => void;
  setPatientTypes: (types: PatientTypeConfig[]) => void;
  setBookmarks: (bookmarks: any[]) => void;
  setBookmarkCategories: (categories: any[]) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  setIsBackupModalOpen: (open: boolean) => void;
  setIsDrivePickerOpen: (open: boolean) => void;
  setDriveFolderPreference: (preference: DriveFolderPreference) => void;
}

const useBackupManager = ({
  records,
  generalTasks,
  patientTypes,
  bookmarks,
  bookmarkCategories,
  setRecords,
  setGeneralTasks,
  setPatientTypes,
  setBookmarks,
  setBookmarkCategories,
  addToast,
  setIsBackupModalOpen,
  setIsDrivePickerOpen,
  setDriveFolderPreference,
}: UseBackupManagerParams) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleLocalImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const { parseUploadedJson } = await loadStorageService();
        const importedData = await parseUploadedJson(file);
        setRecords(importedData.patients);
        setGeneralTasks(importedData.generalTasks || []);
        if (importedData.patientTypes) setPatientTypes(importedData.patientTypes);
        setBookmarks(importedData.bookmarks || []);
        setBookmarkCategories(
          importedData.bookmarkCategories && importedData.bookmarkCategories.length > 0
            ? importedData.bookmarkCategories
            : defaultBookmarkCategories
        );
        addToast('success', 'Base de datos local restaurada');
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al leer el archivo');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [addToast, setBookmarkCategories, setBookmarks, setGeneralTasks, setPatientTypes, setRecords]
  );

  const handleBackupConfirm = useCallback(
    async (fileName: string, folder: DriveFolderPreference) => {
      const { getActiveAccessToken, uploadFileToDrive } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) {
        addToast('error', 'No hay sesión de Google activa.');
        return;
      }
      setIsUploading(true);
      setDriveFolderPreference(folder);
      try {
        const backupData = {
          patients: records,
          generalTasks: generalTasks,
          patientTypes: patientTypes,
          bookmarks,
          bookmarkCategories,
        };
        const finalName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
        await uploadFileToDrive(JSON.stringify(backupData, null, 2), finalName, token, folder.name, folder.id);
        addToast('success', `Respaldo guardado en carpeta "${folder.name}"`);
        setIsBackupModalOpen(false);
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al subir a Drive');
      } finally {
        setIsUploading(false);
      }
    },
    [addToast, bookmarkCategories, bookmarks, generalTasks, patientTypes, records, setDriveFolderPreference, setIsBackupModalOpen]
  );

  const handleDriveFileSelect = useCallback(
    async (fileId: string) => {
      const { getActiveAccessToken, downloadFile } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) return;

      setIsUploading(true);
      try {
        const data = await downloadFile(fileId, token);

        if (data.patients && Array.isArray(data.patients)) {
          setRecords(data.patients);
          if (data.generalTasks) setGeneralTasks(data.generalTasks);
          if (data.patientTypes) setPatientTypes(data.patientTypes);
          if (Array.isArray(data.bookmarks)) setBookmarks(data.bookmarks);
          if (Array.isArray(data.bookmarkCategories)) {
            setBookmarkCategories(data.bookmarkCategories);
          } else {
            setBookmarkCategories(defaultBookmarkCategories);
          }
          addToast('success', 'Respaldo restaurado exitosamente');
          setIsDrivePickerOpen(false);
        } else if (Array.isArray(data)) {
          setRecords(data);
          setGeneralTasks([]);
          setBookmarks([]);
          setBookmarkCategories(defaultBookmarkCategories);
          addToast('success', 'Respaldo (formato antiguo) restaurado');
          setIsDrivePickerOpen(false);
        } else {
          throw new Error('Formato de archivo no reconocido');
        }
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al restaurar desde Drive');
      } finally {
        setIsUploading(false);
      }
    },
    [addToast, setBookmarkCategories, setBookmarks, setGeneralTasks, setIsDrivePickerOpen, setPatientTypes, setRecords]
  );

  return {
    isUploading,
    handleLocalImport,
    handleBackupConfirm,
    handleDriveFileSelect,
  } as const;
};

export default useBackupManager;
