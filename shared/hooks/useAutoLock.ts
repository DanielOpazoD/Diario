import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoLockParams {
  securityPin?: string | null;
  autoLockMinutes: number;
  onLock?: () => void;
  onUnlock?: () => void;
}

const useAutoLock = ({ securityPin, autoLockMinutes, onLock, onUnlock }: UseAutoLockParams) => {
  const [isLocked, setIsLocked] = useState(() => Boolean(securityPin));
  const lastActivityRef = useRef(Date.now());
  const previousLockState = useRef(isLocked);

  const handleUnlock = useCallback(
    (pinAttempt: string) => {
      if (pinAttempt === securityPin) {
        setIsLocked(false);
        lastActivityRef.current = Date.now();
        return true;
      }

      return false;
    },
    [securityPin]
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
      lastActivityRef.current = Date.now();
    } else {
      setIsLocked(false);
    }
  }, [securityPin]);

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
