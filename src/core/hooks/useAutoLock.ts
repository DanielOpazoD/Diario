import { useCallback, useEffect, useRef, useState } from 'react';
import { verifyPin } from '@shared/utils/security';

interface UseAutoLockParams {
  securityPinHash?: string | null;
  securityPinSalt?: string | null;
  autoLockMinutes: number;
  onLock?: () => void;
  onUnlock?: () => void;
}

const useAutoLock = ({ securityPinHash, securityPinSalt, autoLockMinutes, onLock, onUnlock }: UseAutoLockParams) => {
  const hasPin = Boolean(securityPinHash && securityPinSalt);
  const [isLocked, setIsLocked] = useState(() => hasPin);
  const lastActivityRef = useRef(0);
  useEffect(() => { lastActivityRef.current = Date.now(); }, []);
  const previousLockState = useRef(isLocked);

  const handleUnlock = useCallback(
    async (pinAttempt: string) => {
      if (!securityPinHash || !securityPinSalt) {
        return false;
      }

      const isValid = await verifyPin(pinAttempt, securityPinSalt, securityPinHash);
      if (isValid) {
        setIsLocked(false);
        lastActivityRef.current = Date.now();
        return true;
      }

      return false;
    },
    [securityPinHash, securityPinSalt]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateActivity = () => {
      if (!isLocked) {
        lastActivityRef.current = Date.now();
      }
    };

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, [isLocked]);

  useEffect(() => {
    if (!hasPin || autoLockMinutes <= 0) {
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
  }, [hasPin, autoLockMinutes, isLocked]);

  useEffect(() => {
    if (hasPin) {
      setIsLocked(true);
      lastActivityRef.current = Date.now();
    } else {
      setIsLocked(false);
    }
  }, [hasPin]);

  useEffect(() => {
    if (previousLockState.current !== isLocked) {
      if (isLocked) {
        onLock?.();
      } else {
        onUnlock?.();
      }
      previousLockState.current = isLocked;
    }
  }, [isLocked, onLock, onUnlock]);

  return { isLocked, handleUnlock };
};

export default useAutoLock;
