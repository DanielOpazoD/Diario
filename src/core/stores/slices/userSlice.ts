import { StateCreator } from 'zustand';
import { User } from '@shared/types';

export interface UserSlice {
  user: User | null;
  theme: 'light' | 'dark';
  login: (user: User) => void;
  logout: () => void;
  toggleTheme: () => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user: null,
  theme: 'light',
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    // Side effect for DOM
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
});
