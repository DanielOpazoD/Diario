import { useEffect, useState } from 'react';
import { DriveFolderPreference } from '../types';

const DEFAULT_PREFERENCE: DriveFolderPreference = { id: null, name: 'MediDiario Backups' };

export function useDriveFolderPreference() {
  const [driveFolderPreference, setDriveFolderPreference] = useState<DriveFolderPreference>(() => {
    const stored = localStorage.getItem('medidiario_drive_folder');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('No se pudo leer la carpeta preferida de Drive', e);
      }
    }
    return DEFAULT_PREFERENCE;
  });

  useEffect(() => {
    localStorage.setItem('medidiario_drive_folder', JSON.stringify(driveFolderPreference));
  }, [driveFolderPreference]);

  return { driveFolderPreference, setDriveFolderPreference } as const;
}

export default useDriveFolderPreference;
