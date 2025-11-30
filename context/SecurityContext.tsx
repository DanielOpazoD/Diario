import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useAppStore from '../stores/useAppStore';

interface SecurityContextValue {
  masterKey: string | null;
  needsMasterKey: boolean;
  onboardingMode: 'create' | 'unlock';
  setMasterKey: (value: string) => void;
  clearMasterKey: () => void;
}

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

const getOnboardingKey = (email: string) => `medidiario_master_onboarded_${email.toLowerCase()}`;

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAppStore((state) => state.user);
  const [masterKey, setMasterKeyState] = useState<string | null>(null);
  const [onboardingMode, setOnboardingMode] = useState<'create' | 'unlock'>('create');

  useEffect(() => {
    if (typeof window === 'undefined' || !user) {
      setMasterKeyState(null);
      setOnboardingMode('create');
      return;
    }

    const flag = localStorage.getItem(getOnboardingKey(user.email));
    setOnboardingMode(flag ? 'unlock' : 'create');
    setMasterKeyState(null);
  }, [user]);

  const setMasterKey = (value: string) => {
    setMasterKeyState(value);
    if (user) {
      localStorage.setItem(getOnboardingKey(user.email), 'true');
    }
  };

  const clearMasterKey = () => {
    setMasterKeyState(null);
  };

  const value = useMemo(
    () => ({
      masterKey,
      needsMasterKey: Boolean(user) && !masterKey,
      onboardingMode,
      setMasterKey,
      clearMasterKey,
    }),
    [masterKey, onboardingMode, user]
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity debe usarse dentro de un SecurityProvider');
  }
  return context;
};

export default SecurityContext;
