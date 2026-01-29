import type { User } from '@shared/types';

export interface AuthPort {
  loginWithGoogle: () => Promise<User>;
  loginAsGuest: () => Promise<User>;
  logout: () => Promise<void>;
  subscribeToAuthChanges: (callback: (user: User | null) => void) => () => void;
}
