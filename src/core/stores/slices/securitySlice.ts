import { StateCreator } from 'zustand';

export interface SecuritySlice {
  securityPinHash: string | null;
  securityPinSalt: string | null;
  autoLockMinutes: number;
  setSecurityPin: (pinHash: string | null, pinSalt: string | null) => void;
  setAutoLockMinutes: (minutes: number) => void;
}

export const createSecuritySlice: StateCreator<SecuritySlice> = (set) => ({
  securityPinHash: null,
  securityPinSalt: null,
  autoLockMinutes: 5,
  setSecurityPin: (pinHash, pinSalt) => set({ securityPinHash: pinHash, securityPinSalt: pinSalt }),
  setAutoLockMinutes: (minutes) => set({ autoLockMinutes: minutes }),
});
