import { useCallback, useEffect, useRef, useState } from 'react';

interface AutoLockParams {
  securityPin: string | null;
  autoLockMinutes: number;
}

export function useAutoLock({ securityPin, autoLockMinutes }: AutoLockParams) {
  const lastActivityRef = useRef(Date.now());
  const [isLocked, setIsLocked] = useState(() => Boolean(securityPin));

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    recordActivity();
  }, [recordActivity]);

  const lock = useCallback(() => setIsLocked(true), []);

  useEffect(() => {
    if (!securityPin || autoLockMinutes <= 0) {
      setIsLocked(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - lastActivityRef.current) / 60000;
      if (!isLocked && elapsedMinutes >= autoLockMinutes) {
        setIsLocked(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [securityPin, autoLockMinutes, isLocked]);

  useEffect(() => {
    if (securityPin) {
      setIsLocked(true);
      recordActivity();
    } else {
      setIsLocked(false);
    }
  }, [securityPin, recordActivity]);

  return { isLocked, lock, unlock, recordActivity, lastActivityRef } as const;
}

export default useAutoLock;
