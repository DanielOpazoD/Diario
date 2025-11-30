import { useEffect, useState } from 'react';
import { DriveFolderPreference } from '../shared/types/index.ts';

const DEFAULT_DRIVE_FOLDER: DriveFolderPreference = {
  id: null,
  name: 'MediDiario Backups'
};

const loadStoredPreference = (): DriveFolderPreference => {
  const stored = localStorage.getItem('medidiario_drive_folder');
  if (!stored) return DEFAULT_DRIVE_FOLDER;

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('No se pudo leer la carpeta preferida de Drive', error);
    return DEFAULT_DRIVE_FOLDER;
  }
};

const useDriveFolderPreference = () => {
  const [driveFolderPreference, setDriveFolderPreference] = useState<DriveFolderPreference>(loadStoredPreference);

  useEffect(() => {
    localStorage.setItem('medidiario_drive_folder', JSON.stringify(driveFolderPreference));
  }, [driveFolderPreference]);

  return { driveFolderPreference, setDriveFolderPreference } as const;
};

export { DEFAULT_DRIVE_FOLDER };
export default useDriveFolderPreference;
