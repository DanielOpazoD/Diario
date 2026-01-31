import type { StateCreator } from 'zustand';
import type { ToastMessage } from '@shared/types';

export interface UiSlice {
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  syncStatus: 'idle' | 'saving' | 'synced' | 'error';
  lastSyncAt: number | null;
  setSyncStatus: (status: 'idle' | 'saving' | 'synced' | 'error', timestamp?: number | null) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  toasts: [],
  addToast: (type, message) => set((state) => ({
    toasts: [...state.toasts, { id: crypto.randomUUID(), type, message }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  syncStatus: 'idle',
  lastSyncAt: null,
  setSyncStatus: (status, timestamp) => set(() => ({
    syncStatus: status,
    lastSyncAt: typeof timestamp === 'number' ? timestamp : (status === 'synced' ? Date.now() : null),
  })),
});
