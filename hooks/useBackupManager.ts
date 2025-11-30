import type React from 'react';
import { useCallback, useState } from 'react';
import { DriveFolderPreference, PatientRecord } from '../types';
import { defaultBookmarkCategories } from '../stores/slices/bookmarkSlice';
import { decryptPayload, encryptPayload } from '../services/cryptoUtils';

const loadGoogleService = () => import('../services/googleService');
interface UseBackupManagerParams {
  records: PatientRecord[];
  generalTasks: any[];
  patientTypes: any[];
  bookmarks: any[];
  bookmarkCategories: any[];
  masterPassword: string | null;
  masterPasswordHash: string | null;
  masterPasswordSalt: string | null;
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
  masterPassword,
  masterPasswordHash,
  masterPasswordSalt,
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

  const normalizePatients = useCallback((patients: any[]) => (
    patients.map((p: any) => ({
      ...p,
      attachedFiles: Array.isArray(p.attachedFiles) ? p.attachedFiles : [],
      pendingTasks: Array.isArray(p.pendingTasks) ? p.pendingTasks : [],
    }))
  ), []);

  const applyBackupPayload = useCallback(
    (payload: any, sourceLabel: string) => {
      if (payload?.patients && Array.isArray(payload.patients)) {
        setRecords(normalizePatients(payload.patients));
        if (payload.generalTasks) setGeneralTasks(payload.generalTasks);
        if (Array.isArray(payload.bookmarks)) setBookmarks(payload.bookmarks);
        if (Array.isArray(payload.bookmarkCategories)) {
          setBookmarkCategories(payload.bookmarkCategories);
        } else {
          setBookmarkCategories(defaultBookmarkCategories);
        }
        addToast('success', `Respaldo restaurado (${sourceLabel})`);
        return true;
      }

      if (Array.isArray(payload)) {
        setRecords(normalizePatients(payload));
        setBookmarks([]);
        setBookmarkCategories(defaultBookmarkCategories);
        addToast('success', `Respaldo (formato antiguo) restaurado (${sourceLabel})`);
        return true;
      }

      throw new Error('Formato de archivo no reconocido');
    },
    [addToast, normalizePatients, setBookmarkCategories, setBookmarks, setGeneralTasks, setRecords]
  );

  const handleLocalImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const rawContent = await file.text();
        const parsed = JSON.parse(rawContent);
        let payload = parsed;

        if (parsed?.encrypted) {
          if (!masterPassword) {
            addToast('error', 'Necesitas la Contraseña Maestra para abrir este respaldo.');
            return;
          }
          const content = await decryptPayload(parsed.cipherText, parsed.iv, masterPassword, parsed.salt || masterPasswordSalt || '');
          payload = JSON.parse(content);
        }

        applyBackupPayload(payload, 'importación local');
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al leer el archivo');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [addToast, applyBackupPayload, masterPassword, masterPasswordSalt]
  );

  const handleBackupConfirm = useCallback(
    async (fileName: string, folder: DriveFolderPreference) => {
      const { getActiveAccessToken, uploadFileToDrive } = await loadGoogleService();
      const token = getActiveAccessToken();
      if (!token) {
        addToast('error', 'No hay sesión de Google activa.');
        return;
      }
      if (!masterPasswordHash || !masterPasswordSalt) {
        addToast('error', 'Configura tu Contraseña Maestra antes de subir respaldos.');
        return;
      }
      if (!masterPassword) {
        addToast('error', 'Ingresa tu Contraseña Maestra para cifrar el respaldo.');
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
        const encrypted = await encryptPayload(JSON.stringify(backupData, null, 2), masterPassword, masterPasswordSalt);

        const payload = {
          version: 1,
          encrypted: true,
          cipherText: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: masterPasswordSalt,
        };

        await uploadFileToDrive(JSON.stringify(payload, null, 2), finalName, token, folder.name, folder.id);
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
      generalTasks,
      masterPassword,
      masterPasswordHash,
      masterPasswordSalt,
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
        const data = await downloadFile(fileId, token);
        let payload = data;

        if (data?.encrypted) {
          if (!masterPassword) {
            addToast('error', 'Ingresa tu Contraseña Maestra para restaurar este respaldo.');
            return;
          }
          const content = await decryptPayload(data.cipherText, data.iv, masterPassword, data.salt || masterPasswordSalt || '');
          payload = JSON.parse(content);
        }

        const restored = applyBackupPayload(payload, 'Google Drive');
        if (restored) {
          setIsDrivePickerOpen(false);
        }
      } catch (err) {
        console.error(err);
        addToast('error', 'Error al restaurar desde Drive');
      } finally {
        setIsUploading(false);
      }
    },
    [addToast, applyBackupPayload, masterPassword, masterPasswordSalt, setIsDrivePickerOpen]
  );

  return {
    isUploading,
    handleLocalImport,
    handleBackupConfirm,
    handleDriveFileSelect,
  } as const;
};

export default useBackupManager;
