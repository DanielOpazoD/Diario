import { act, renderHook } from '@testing-library/react';
import useDriveFolderPreference from '../useDriveFolderPreference';

const PREFERENCE_KEY = 'medidiario_drive_folder';

describe('useDriveFolderPreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe usar la carpeta por defecto cuando no hay preferencia almacenada', () => {
    const { result } = renderHook(() => useDriveFolderPreference());
    expect(result.current.driveFolderPreference).toEqual({ id: null, name: 'MediDiario Backups' });
  });

  it('guarda la preferencia en localStorage cuando cambia', () => {
    const { result } = renderHook(() => useDriveFolderPreference());

    act(() => {
      result.current.setDriveFolderPreference({ id: '123', name: 'Nueva Carpeta' });
    });

    expect(localStorage.getItem(PREFERENCE_KEY)).toBe(JSON.stringify({ id: '123', name: 'Nueva Carpeta' }));
  });
});
