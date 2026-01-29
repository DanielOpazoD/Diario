import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_ROUTE, VIEW_ROUTES } from '@shared/routes';

const useRouteGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
    const knownRoutes = Object.values(VIEW_ROUTES).map(route => route.replace(/\/$/, '') || '/');

    if (!knownRoutes.includes(normalizedPath)) {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [location.pathname, navigate]);

  return { location, navigate };
};

export default useRouteGuard;
