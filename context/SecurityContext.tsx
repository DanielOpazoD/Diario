import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useAppStore from '../stores/useAppStore';
import { deriveMasterKey } from '../services/cryptoService';

export type SecurityStatus = 'checking' | 'needs-setup' | 'requires-unlock' | 'ready';

interface SecurityContextValue {
  status: SecurityStatus;
  userEmail: string | null;
  sessionKey: CryptoKey | null;
  hasProfile: boolean;
  setMasterPassword: (password: string) => Promise<void>;
  unlockWithMasterPassword: (password: string) => Promise<boolean>;
  clearSession: () => void;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

const buildProfileKey = (email: string) => `medidiario_master_profile_${email.toLowerCase()}`;

const readProfileStatus = (email: string | null) => {
  if (!email) return false;
  try {
    return Boolean(localStorage.getItem(buildProfileKey(email)));
  } catch (e) {
    console.error('No se pudo leer el estado de seguridad', e);
    return false;
  }
};

export const SecurityProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const userEmail = useAppStore((state) => state.user?.email ?? null);
  const [status, setStatus] = useState<SecurityStatus>('checking');
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setSessionKey(null);
    const profileExists = readProfileStatus(userEmail);
    setHasProfile(profileExists);
    if (!userEmail) {
      setStatus('checking');
      return;
    }

    setStatus(profileExists ? 'requires-unlock' : 'needs-setup');
  }, [userEmail]);

  const setMasterPassword = useCallback(
    async (password: string) => {
      if (!userEmail) throw new Error('No hay correo de usuario disponible');
      const key = await deriveMasterKey(password, userEmail);
      setSessionKey(key);
      setStatus('ready');
      try {
        localStorage.setItem(buildProfileKey(userEmail), '1');
        setHasProfile(true);
      } catch (e) {
        console.error('No se pudo guardar la preferencia de seguridad', e);
      }
    },
    [userEmail]
  );

  const unlockWithMasterPassword = useCallback(
    async (password: string) => {
      try {
        await setMasterPassword(password);
        return true;
      } catch (e) {
        console.error('Error al desbloquear con Contraseña Maestra', e);
        return false;
      }
    },
    [setMasterPassword]
  );

  const clearSession = useCallback(() => {
    setSessionKey(null);
    setStatus(hasProfile && userEmail ? 'requires-unlock' : 'needs-setup');
  }, [hasProfile, userEmail]);

  const value: SecurityContextValue = useMemo(
    () => ({
      status,
      userEmail,
      sessionKey,
      hasProfile,
      setMasterPassword,
      unlockWithMasterPassword,
      clearSession,
    }),
    [status, userEmail, sessionKey, hasProfile, setMasterPassword, unlockWithMasterPassword]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity debe usarse dentro de SecurityProvider');
  }
  return ctx;
};
