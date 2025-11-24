import { useEffect, useRef } from 'react';
import { getActiveAccessToken, isTokenExpired, isTokenExpiringSoon, renewGoogleToken } from '../services/googleService';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const EXPIRY_THRESHOLD_MS = 10 * 60 * 1000;

const useGoogleSessionMonitor = () => {
  const isRefreshing = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkAndRefresh = async () => {
      if (!isMounted) return;

      const token = getActiveAccessToken();
      if (!token) return;

      const shouldRenew = isTokenExpired() || isTokenExpiringSoon(EXPIRY_THRESHOLD_MS);
      if (!shouldRenew || isRefreshing.current) return;

      isRefreshing.current = true;
      try {
        await renewGoogleToken();
      } catch (error) {
        console.warn('No se pudo renovar la sesión de Google automáticamente', error);
      } finally {
        isRefreshing.current = false;
      }
    };

    checkAndRefresh();
    const intervalId = window.setInterval(checkAndRefresh, REFRESH_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
};

export default useGoogleSessionMonitor;
