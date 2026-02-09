import { beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createSecuritySlice, SecuritySlice } from '@core/stores/slices/securitySlice';

describe('securitySlice', () => {
  const useStore = create<SecuritySlice>(createSecuritySlice);

  beforeEach(() => {
    useStore.setState({ securityPinHash: null, securityPinSalt: null, autoLockMinutes: 5 } as any);
  });

  it('updates security settings', () => {
    useStore.getState().setSecurityPin('hash', 'salt');
    useStore.getState().setAutoLockMinutes(10);
    expect(useStore.getState().securityPinHash).toBe('hash');
    expect(useStore.getState().securityPinSalt).toBe('salt');
    expect(useStore.getState().autoLockMinutes).toBe(10);
  });
});
