import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { createUiSlice, UiSlice } from '@core/stores/slices/uiSlice';

describe('uiSlice', () => {
  const useStore = create<UiSlice>(createUiSlice);

  beforeEach(() => {
    useStore.setState({ toasts: [], syncStatus: 'idle', lastSyncAt: null } as any);
  });

  it('adds and removes toasts', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('00000000-0000-0000-0000-000000000004');
    useStore.getState().addToast('success', 'Ok');
    expect(useStore.getState().toasts).toHaveLength(1);
    useStore.getState().removeToast('00000000-0000-0000-0000-000000000004');
    expect(useStore.getState().toasts).toHaveLength(0);
  });

  it('sets sync status with timestamp', () => {
    useStore.getState().setSyncStatus('saving', 123);
    expect(useStore.getState().syncStatus).toBe('saving');
    expect(useStore.getState().lastSyncAt).toBe(123);
  });

  it('sets sync status and auto-updates timestamp', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(999);
    useStore.getState().setSyncStatus('synced');
    expect(useStore.getState().syncStatus).toBe('synced');
    expect(useStore.getState().lastSyncAt).toBe(999);
  });
});
