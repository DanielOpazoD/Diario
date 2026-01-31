import { StateCreator } from 'zustand';

export interface SecuritySlice {
  securityPin: string | null;
  autoLockMinutes: number;
  setSecurityPin: (pin: string | null) => void;
  setAutoLockMinutes: (minutes: number) => void;
}

export const createSecuritySlice: StateCreator<SecuritySlice> = (set) => ({
  securityPin: null,
  autoLockMinutes: 5,
  setSecurityPin: (pin) => set({ securityPin: pin }),
  setAutoLockMinutes: (minutes) => set({ autoLockMinutes: minutes }),
});
