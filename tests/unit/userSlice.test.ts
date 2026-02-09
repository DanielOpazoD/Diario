import { beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createUserSlice, UserSlice } from '@core/stores/slices/userSlice';

describe('userSlice', () => {
  const useStore = create<UserSlice>(createUserSlice);

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    useStore.setState({ user: null, theme: 'light' } as any);
  });

  it('logs in and out', () => {
    useStore.getState().login({ name: 'Ana', email: 'a@b.com', avatar: 'https://x' } as any);
    expect(useStore.getState().user?.name).toBe('Ana');
    useStore.getState().logout();
    expect(useStore.getState().user).toBeNull();
  });

  it('toggles theme and updates DOM class', () => {
    useStore.getState().toggleTheme();
    expect(useStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    useStore.getState().toggleTheme();
    expect(useStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
