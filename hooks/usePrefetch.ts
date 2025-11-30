import { useCallback, useEffect, useRef } from 'react';
import { ViewMode } from '../types';

// Module prefetch functions - these match the lazy imports in App.tsx
const prefetchModules = {
  daily: () => import('../features/daily/DailyView'),
  stats: () => import('../features/stats/StatsView'),
  history: () => import('../features/history/PatientsHistoryView'),
  bookmarks: () => import('../features/bookmarks/BookmarksView'),
  tasks: () => import('../components/TaskDashboard'),
  settings: () => import('../components/Settings'),
  patientModal: () => import('../components/PatientModal'),
  backupModal: () => import('../components/BackupModal'),
  drivePickerModal: () => import('../components/DrivePickerModal'),
  bookmarksModal: () => import('../components/BookmarksModal'),
};

// Service prefetch functions
const prefetchServices = {
  report: () => import('../services/reportService'),
  google: () => import('../services/googleService'),
  gemini: () => import('../services/geminiService'),
  storage: () => import('../services/storage'),
};

// Track which modules have been prefetched
const prefetchedModules = new Set<string>();

/**
 * Prefetch a module if it hasn't been prefetched yet
 */
const prefetch = async (key: string, loader: () => Promise<any>) => {
  if (prefetchedModules.has(key)) return;
  prefetchedModules.add(key);

  try {
    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        loader().catch(() => {
          // Silently fail - module will be loaded when needed
          prefetchedModules.delete(key);
        });
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        loader().catch(() => {
          prefetchedModules.delete(key);
        });
      }, 100);
    }
  } catch {
    prefetchedModules.delete(key);
  }
};

/**
 * Hook for prefetching modules based on user navigation patterns
 */
export function usePrefetch(currentView: ViewMode) {
  const hasInitialPrefetch = useRef(false);

  // Prefetch commonly accessed modules after initial load
  useEffect(() => {
    if (hasInitialPrefetch.current) return;
    hasInitialPrefetch.current = true;

    // After app loads, prefetch the most likely next modules
    const timer = setTimeout(() => {
      // Always prefetch patient modal since it's frequently used
      prefetch('patientModal', prefetchModules.patientModal);

      // Prefetch based on current view - predict next likely navigation
      if (currentView === 'daily') {
        prefetch('stats', prefetchModules.stats);
        prefetch('tasks', prefetchModules.tasks);
      }
    }, 1500); // Wait 1.5s after initial render

    return () => clearTimeout(timer);
  }, []);

  // Prefetch on hover/focus of navigation items
  const prefetchOnHover = useCallback((view: ViewMode) => {
    const loader = prefetchModules[view];
    if (loader) {
      prefetch(view, loader);
    }
  }, []);

  // Prefetch modal on button hover
  const prefetchModal = useCallback((modalType: 'patientModal' | 'backupModal' | 'drivePickerModal' | 'bookmarksModal') => {
    const loader = prefetchModules[modalType];
    if (loader) {
      prefetch(modalType, loader);
    }
  }, []);

  // Prefetch service on action indication
  const prefetchService = useCallback((serviceType: keyof typeof prefetchServices) => {
    const loader = prefetchServices[serviceType];
    if (loader) {
      prefetch(serviceType, loader);
    }
  }, []);

  return {
    prefetchOnHover,
    prefetchModal,
    prefetchService,
  };
}

/**
 * Prefetch adjacent views based on navigation prediction
 */
export function prefetchAdjacentViews(currentView: ViewMode) {
  const adjacentViews: Record<ViewMode, ViewMode[]> = {
    daily: ['stats', 'tasks', 'history'],
    stats: ['daily', 'history'],
    history: ['daily', 'stats'],
    tasks: ['daily', 'bookmarks'],
    bookmarks: ['daily', 'tasks'],
    settings: ['daily'],
  };

  const viewsToPrefetch = adjacentViews[currentView] || [];

  // Stagger prefetching to avoid blocking
  viewsToPrefetch.forEach((view, index) => {
    setTimeout(() => {
      const loader = prefetchModules[view];
      if (loader) {
        prefetch(view, loader);
      }
    }, index * 500); // 500ms between each prefetch
  });
}

export default usePrefetch;
