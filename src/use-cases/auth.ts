import { firebaseAuthAdapter, AuthError } from '@data/adapters/firebaseAuthAdapter';

export const loginWithGoogle = firebaseAuthAdapter.loginWithGoogle;
export const loginAsGuest = firebaseAuthAdapter.loginAsGuest;
export const logout = firebaseAuthAdapter.logout;
export const subscribeToAuthChanges = firebaseAuthAdapter.subscribeToAuthChanges;

export { AuthError };
