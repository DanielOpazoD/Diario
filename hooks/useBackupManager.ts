import type React from 'react';
import { useCallback, useState } from 'react';
import { DriveFolderPreference, PatientRecord } from '../types';
import { defaultBookmarkCategories } from '../stores/slices/bookmarkSlice';
import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackup } from '../services/cryptoService';
import { useSecurity } from '../context/SecurityContext';

const loadGoogleService = () => import('../services/googleService');

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
  const [isUploading, setIsUploading] = useState(false);
  const { sessionKey, userEmail, status: securityStatus } = useSecurity();

  const normalizePatients = useCallback((list: any[]) => (
    list.map((p: any) => ({
      ...p,
      attachedFiles: Array.isArray(p.attachedFiles) ? p.attachedFiles : [],
      pendingTasks: Array.isArray(p.pendingTasks) ? p.pendingTasks : [],
    }))
  ), []);

  const ensureMasterKeyReady = useCallback(() => {
    if (!sessionKey || !userEmail || securityStatus !== 'ready') {
      addToast('error', 'Necesitas ingresar tu Contraseña Maestra para continuar.');
      return null;
    }
    return { key: sessionKey, email: userEmail } as const;
  }, [addToast, securityStatus, sessionKey, userEmail]);

  const applyBackupData = useCallback((data: any) => {
    if (data.patients && Array.isArray(data.patients)) {
      setRecords(normalizePatients(data.patients));
      if (data.generalTasks) setGeneralTasks(data.generalTasks);
      if (Array.isArray(data.bookmarks)) setBookmarks(data.bookmarks);
      if (Array.isArray(data.bookmarkCategories)) {
        setBookmarkCategories(data.bookmarkCategories);
      } else {
        setBookmarkCategories(defaultBookmarkCategories);
      }
      return 'full';
    }

    if (Array.isArray(data)) {
      setRecords(normalizePatients(data));
      setBookmarks([]);
      setBookmarkCategories(defaultBookmarkCategories);
      return 'legacy';
    }

    throw new Error('Formato de archivo no reconocido');
  }, [normalizePatients, setBookmarkCategories, setBookmarks, setGeneralTasks, setRecords]);

  const resolveBackupData = useCallback(async (rawData: any) => {
    if (isEncryptedBackup(rawData)) {
      const encryption = ensureMasterKeyReady();
      if (!encryption) throw new Error('Contraseña Maestra requerida para desencriptar.');
      return decryptBackupPayload(rawData, encryption.key, encryption.email);
    }
    return rawData;
  }, [ensureMasterKeyReady]);

  const handleLocalImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const rawContent = await file.text();
        const parsed = JSON.parse(rawContent);
        const data = await resolveBackupData(parsed);
        const format = applyBackupData(data);
        addToast('success', format === 'legacy' ? 'Respaldo (formato antiguo) restaurado' : 'Base de datos local restaurada');
      } catch (err) {
        console.error(err);
        const message = err instanceof Error && err.message ? err.message : 'Error al leer el archivo';
        addToast('error', message);
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [addToast, applyBackupData, resolveBackupData]
  );

  const handleBackupConfirm = useCallback(
    async (fileName: string, folder: DriveFolderPreference) => {
      const { getActiveAccessToken, uploadFileToDrive } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) {
        addToast('error', 'No hay sesión de Google activa.');
        return;
      }
      const encryption = ensureMasterKeyReady();
      if (!encryption) {
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
        const encryptedPayload = await encryptBackupPayload(backupData, encryption.key, encryption.email, folder);
        await uploadFileToDrive(JSON.stringify(encryptedPayload, null, 2), finalName, token, folder.name, folder.id);
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
      ensureMasterKeyReady,
      generalTasks,
      patientTypes,
      records,
      setDriveFolderPreference,
      setIsBackupModalOpen,
    ]
  );

  const handleDriveFileSelect = useCallback(
    async (fileId: string) => {
      const { getActiveAccessToken, downloadFile } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) return;

      setIsUploading(true);
      try {
        const rawData = await downloadFile(fileId, token);
        const data = await resolveBackupData(rawData);
        const format = applyBackupData(data);
        addToast('success', format === 'legacy' ? 'Respaldo (formato antiguo) restaurado' : 'Respaldo restaurado exitosamente');
        setIsDrivePickerOpen(false);
      } catch (err) {
        console.error(err);
        const message = err instanceof Error && err.message ? err.message : 'Error al restaurar desde Drive';
        addToast('error', message);
      } finally {
        setIsUploading(false);
      }
    },
    [addToast, applyBackupData, resolveBackupData, setIsDrivePickerOpen]
  );

  return {
    isUploading,
    handleLocalImport,
    handleBackupConfirm,
    handleDriveFileSelect,
  } as const;
};

export default useBackupManager;
