import { useState, useEffect } from 'react';
import { ViewMode } from '@shared/types';

/**
 * Handle sidebar open/close state logic in relation to viewMode changes and mobile resolutions.
 */
export const useResponsiveSidebar = (viewMode: ViewMode) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };

        // Standardize: Hide sidebar on mobile when navigating
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [viewMode]);

    return {
        isSidebarOpen,
        openSidebar: () => setIsSidebarOpen(true),
        closeSidebar: () => setIsSidebarOpen(false),
    };
};
