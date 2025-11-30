import type React from 'react';
import { useCallback, useState } from 'react';
import { DriveFolderPreference, PatientRecord } from '../types';
import { defaultBookmarkCategories } from '../stores/slices/bookmarkSlice';
import useSecurity from './useSecurity';

const loadGoogleService = () => import('../services/googleService');
const loadStorageService = () => import('../services/storage');

interface UseBackupManagerParams {
  records: PatientRecord[];
  generalTasks: any[];
  patientTypes: any[];
  bookmarks: any[];
  bookmarkCategories: any[];
  setRecords: (records: PatientRecord[]) => void;
  setGeneralTasks: (tasks: any[]) => void;
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
  setBookmarks,
  setBookmarkCategories,
  addToast,
  setIsBackupModalOpen,
  setIsDrivePickerOpen,
  setDriveFolderPreference,
}: UseBackupManagerParams) => {
  const { hasMasterKey, encryptBackupPayload, decryptBackupPayload, requestMasterPassword } = useSecurity();
  const [isUploading, setIsUploading] = useState(false);

  const handleLocalImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const { parseUploadedJson } = await loadStorageService();
        const importedRecords = await parseUploadedJson(file);
        setRecords(importedRecords);
        addToast('success', 'Base de datos local restaurada');
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al leer el archivo');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [addToast, setRecords]
  );

  const handleBackupConfirm = useCallback(
    async (fileName: string, folder: DriveFolderPreference) => {
      const { getActiveAccessToken, uploadFileToDrive } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) {
        addToast('error', 'No hay sesión de Google activa.');
        return;
      }

      if (!hasMasterKey) {
        addToast('error', 'Configura tu Contraseña Maestra para cifrar el respaldo.');
        requestMasterPassword();
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
        const encryptedPayload = await encryptBackupPayload(backupData);
        await uploadFileToDrive(encryptedPayload, finalName, token, folder.name, folder.id);
        addToast('success', `Respaldo guardado en carpeta "${folder.name}"`);
        setIsBackupModalOpen(false);
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al subir a Drive');
      } finally {
        setIsUploading(false);
      }
    },
    [
      addToast,
      bookmarkCategories,
      bookmarks,
      encryptBackupPayload,
      generalTasks,
      hasMasterKey,
      patientTypes,
      records,
      requestMasterPassword,
      setDriveFolderPreference,
      setIsBackupModalOpen,
    ]
  );

  const handleDriveFileSelect = useCallback(
    async (fileId: string) => {
      const { getActiveAccessToken, downloadFile } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) return;

      if (!hasMasterKey) {
        addToast('error', 'Ingresa tu Contraseña Maestra para restaurar respaldos seguros.');
        requestMasterPassword();
        return;
      }

      setIsUploading(true);
      try {
        const downloaded = await downloadFile(fileId, token);
        const data = await decryptBackupPayload(downloaded);

        if (data.patients && Array.isArray(data.patients)) {
          setRecords(data.patients);
          if (data.generalTasks) setGeneralTasks(data.generalTasks);
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
          setBookmarks([]);
          setBookmarkCategories(defaultBookmarkCategories);
          addToast('success', 'Respaldo (formato antiguo) restaurado');
          setIsDrivePickerOpen(false);
        } else {
          throw new Error('Formato de archivo no reconocido');
        }
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al restaurar desde Drive. Verifica tu Contraseña Maestra.');
      } finally {
        setIsUploading(false);
      }
    },
    [
      addToast,
      decryptBackupPayload,
      hasMasterKey,
      requestMasterPassword,
      setBookmarkCategories,
      setBookmarks,
      setGeneralTasks,
      setIsDrivePickerOpen,
      setRecords,
    ]
  );

  return {
    isUploading,
    handleLocalImport,
    handleBackupConfirm,
    handleDriveFileSelect,
  } as const;
};

export default useBackupManager;
