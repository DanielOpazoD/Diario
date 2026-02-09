import { StateCreator } from 'zustand';
import { STORAGE_DEFAULTS } from '@shared/constants/storageDefaults';

export interface PreferencesSlice {
  highlightPendingPatients: boolean;
  compactStats: boolean;
  showBookmarkBar: boolean;
  setHighlightPendingPatients: (value: boolean) => void;
  setCompactStats: (value: boolean) => void;
  setShowBookmarkBar: (value: boolean) => void;
}

export const createPreferencesSlice: StateCreator<PreferencesSlice> = (set) => ({
  highlightPendingPatients: STORAGE_DEFAULTS.HIGHLIGHT_PENDING_PATIENTS,
  compactStats: STORAGE_DEFAULTS.COMPACT_STATS,
  showBookmarkBar: STORAGE_DEFAULTS.SHOW_BOOKMARK_BAR,
  setHighlightPendingPatients: (value) => set({ highlightPendingPatients: value }),
  setCompactStats: (value) => set({ compactStats: value }),
  setShowBookmarkBar: (value) => set({ showBookmarkBar: value }),
});
