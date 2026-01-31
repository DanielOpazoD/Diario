import { StateCreator } from 'zustand';

export interface PreferencesSlice {
  highlightPendingPatients: boolean;
  compactStats: boolean;
  showBookmarkBar: boolean;
  setHighlightPendingPatients: (value: boolean) => void;
  setCompactStats: (value: boolean) => void;
  setShowBookmarkBar: (value: boolean) => void;
}

export const createPreferencesSlice: StateCreator<PreferencesSlice> = (set) => ({
  highlightPendingPatients: true,
  compactStats: true,
  showBookmarkBar: false,
  setHighlightPendingPatients: (value) => set({ highlightPendingPatients: value }),
  setCompactStats: (value) => set({ compactStats: value }),
  setShowBookmarkBar: (value) => set({ showBookmarkBar: value }),
});
