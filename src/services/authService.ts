
import { getAuthInstance } from './firebase/auth';
import { emitStructuredLog } from './logger';
import type { User } from '@shared/types';
import { UserSchema } from '@shared/schemas';

const DEFAULT_ALLOWED_EMAILS = new Set([
    "d.opazo.damiani@gmail.com",
    "daniel.opazo@hospitalhangaroa.cl"
].map((email) => email.toLowerCase().trim()));

const normalizeEmail = (email: string) => email.toLowerCase().trim();

const parseAllowedEmailsFromEnv = (): Set<string> => {
    const raw = import.meta.env.VITE_ALLOWED_LOGIN_EMAILS;
    if (typeof raw !== 'string' || raw.trim().length === 0) {
        return new Set();
    }
    return new Set(
        raw
            .split(',')
            .map((email) => normalizeEmail(email))
            .filter((email) => email.length > 0)
    );
};

const resolveAllowedEmails = (): { enforce: boolean; emails: Set<string> } => {
    const envAllowed = parseAllowedEmailsFromEnv();
    if (envAllowed.size > 0) {
        return { enforce: true, emails: envAllowed };
    }
    // Local development should not be blocked by hardcoded allowlists.
    if (import.meta.env.DEV) {
        return { enforce: false, emails: new Set() };
    }
    return { enforce: true, emails: DEFAULT_ALLOWED_EMAILS };
};

const ALLOWED_EMAIL_POLICY = resolveAllowedEmails();

const DEFAULT_GUEST_USER: User = {
    name: "Dr. Usuario Local",
    email: "local@medidiario.app",
    avatar: "https://ui-avatars.com/api/?name=Dr+Local&background=0D8ABC&color=fff"
};

export class AuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'AuthError';
    }
}

export const loginWithGoogle = async (): Promise<User> => {
    const auth = await getAuthInstance();
    if (!auth) throw new AuthError("Servicio de autenticación no disponible");

    try {
        const { signInWithPopup, GoogleAuthProvider, signOut } = await import("firebase/auth");
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const email = normalizeEmail(user.email || "");

        if (ALLOWED_EMAIL_POLICY.enforce && !ALLOWED_EMAIL_POLICY.emails.has(email)) {
            await signOut(auth);
            throw new AuthError("Este correo no está autorizado para acceder a la aplicación.", "auth/unauthorized-email");
        }

        const appUser = {
            name: user.displayName || "Usuario Google",
            email: email,
            avatar: user.photoURL || "",
        };

        // Validate with Zod (Optional but good practice)
        return UserSchema.parse(appUser);

    } catch (error: any) {
        emitStructuredLog('error', 'Auth', 'Auth Service Error', { error });
        if (error instanceof AuthError) throw error;

        let message = "Error desconocido al iniciar sesión";
        if (error.code === 'auth/popup-closed-by-user') {
            message = "Inicio de sesión cancelado por el usuario";
        } else if (error.code === 'auth/popup-blocked') {
            message = "El navegador bloqueó la ventana emergente. Permite popups para continuar.";
        } else if (error.code === 'auth/unauthorized-domain') {
            message = "Dominio no autorizado en Firebase Auth. Agrega localhost en dominios autorizados.";
        } else if (error.code === 'auth/network-request-failed') {
            message = "Error de red al iniciar sesión. Revisa tu conexión e intenta nuevamente.";
        } else if (error.message) {
            message = error.message;
        }
        throw new AuthError(message, error.code);
    }
};

export const loginAsGuest = async (): Promise<User> => {
    try {
        const auth = await getAuthInstance();
        if (auth) {
            const { signInAnonymously } = await import("firebase/auth");
            await signInAnonymously(auth);
        }

        return UserSchema.parse(DEFAULT_GUEST_USER);
    } catch (error: any) {
        emitStructuredLog('error', 'Auth', 'Guest Logic Error', { error });
        return DEFAULT_GUEST_USER;
    }
};

export const logout = async () => {
    const auth = await getAuthInstance();
    if (auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    let unsub = () => { };
    let isActive = true;

    (async () => {
        const auth = await getAuthInstance();
        if (!auth || !isActive) return;
        const { onAuthStateChanged } = await import("firebase/auth");
        unsub = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const appUser: User = {
                    name: firebaseUser.displayName || "Usuario",
                    email: firebaseUser.email || "",
                    avatar: firebaseUser.photoURL || "",
                };
                callback(appUser);
            } else {
                callback(null);
            }
        });
    })();

    return () => {
        isActive = false;
        unsub();
    };
};
