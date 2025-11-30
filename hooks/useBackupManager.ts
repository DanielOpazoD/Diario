import type React from 'react';
import { useCallback, useState } from 'react';
import { DriveFolderPreference, PatientRecord } from '../types';
import { defaultBookmarkCategories } from '../stores/slices/bookmarkSlice';

const loadGoogleService = () => import('../services/googleService');
const loadStorageService = () => import('../services/storage');
const loadSecurityService = () => import('../services/securityService');

interface UseBackupManagerParams {
  records: PatientRecord[];
  generalTasks: any[];
  patientTypes: any[];
  bookmarks: any[];
  bookmarkCategories: any[];
  masterKey: string | null;
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
  masterKey,
  setRecords,
  setGeneralTasks,
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
      if (!masterKey) {
        addToast('error', 'Debes desbloquear la Contraseña Maestra para cifrar el respaldo.');
        return;
      }
      setIsUploading(true);
      setDriveFolderPreference(folder);
      try {
        const { encryptPayload } = await loadSecurityService();
        const backupData = {
          patients: records,
          generalTasks: generalTasks,
          patientTypes: patientTypes,
          bookmarks,
          bookmarkCategories,
        };
        const finalName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
        const cipher = await encryptPayload(JSON.stringify(backupData), masterKey);
        const encryptedPayload = JSON.stringify({
          encrypted: true,
          version: '1.0',
          cipher,
          hint: 'Adjuntos no cifrados, solo datos de respaldo (.json)',
        }, null, 2);
        await uploadFileToDrive(encryptedPayload, finalName, token, folder.name, folder.id);
        addToast('success', `Respaldo cifrado guardado en carpeta "${folder.name}"`);
        setIsBackupModalOpen(false);
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al subir a Drive');
      } finally {
        setIsUploading(false);
      }
    },
    [addToast, bookmarkCategories, bookmarks, generalTasks, masterKey, patientTypes, records, setDriveFolderPreference, setIsBackupModalOpen]
  );

  const handleDriveFileSelect = useCallback(
    async (fileId: string) => {
      const { getActiveAccessToken, downloadFile } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) return;

      setIsUploading(true);
      try {
        const rawData = await downloadFile(fileId, token);
        let data = rawData;

        if (rawData?.encrypted) {
          if (!masterKey) {
            addToast('error', 'Necesitas la Contraseña Maestra para descifrar este respaldo.');
            return;
          }
          const { decryptPayload } = await loadSecurityService();
          const plain = await decryptPayload(rawData.cipher, masterKey);
          data = JSON.parse(plain);
        }

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
        addToast('error', 'Error al restaurar desde Drive');
      } finally {
        setIsUploading(false);
      }
    },
    [addToast, masterKey, setBookmarkCategories, setBookmarks, setGeneralTasks, setIsDrivePickerOpen, setRecords]
  );

  return {
    isUploading,
    handleLocalImport,
    handleBackupConfirm,
    handleDriveFileSelect,
  } as const;
};

export default useBackupManager;
