import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ViewMode } from '@shared/types';
import { pathFromView, viewFromPath } from '@shared/routes';

export const useNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const currentView = useMemo(() => viewFromPath(location.pathname), [location.pathname]);

    const handleNavigate = useCallback((view: ViewMode) => {
        const target = pathFromView(view);
        if (location.pathname !== target) {
            navigate(target);
        }
    }, [location.pathname, navigate]);

    return {
        currentView,
        navigate: handleNavigate,
        pathname: location.pathname,
    };
};
