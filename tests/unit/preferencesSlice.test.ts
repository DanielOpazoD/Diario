import { beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createPreferencesSlice, PreferencesSlice } from '@core/stores/slices/preferencesSlice';

describe('preferencesSlice', () => {
  const useStore = create<PreferencesSlice>(createPreferencesSlice);

  beforeEach(() => {
    useStore.setState({
      highlightPendingPatients: true,
      compactStats: true,
      showBookmarkBar: false,
    } as any);
  });

  it('updates preferences', () => {
    useStore.getState().setHighlightPendingPatients(false);
    useStore.getState().setCompactStats(false);
    useStore.getState().setShowBookmarkBar(true);
    expect(useStore.getState().highlightPendingPatients).toBe(false);
    expect(useStore.getState().compactStats).toBe(false);
    expect(useStore.getState().showBookmarkBar).toBe(true);
  });
});
