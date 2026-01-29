import type { AuthPort } from '@data/ports/authPort';
import {
  loginWithGoogle,
  loginAsGuest,
  logout,
  subscribeToAuthChanges,
  AuthError,
} from '@services/authService';

export const firebaseAuthAdapter: AuthPort = {
  loginWithGoogle,
  loginAsGuest,
  logout,
  subscribeToAuthChanges,
};

export { AuthError };
