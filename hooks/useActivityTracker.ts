import { useEffect } from 'react';

export function useActivityTracker(isLocked: boolean, onActivity: () => void) {
  useEffect(() => {
    const updateActivity = () => {
      if (!isLocked) {
        onActivity();
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [isLocked, onActivity]);
}

export default useActivityTracker;
