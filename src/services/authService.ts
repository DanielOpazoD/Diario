
import { getAuthInstance } from './firebase/auth';
import type { User } from '@shared/types';

const ALLOWED_EMAILS = [
    "d.opazo.damiani@gmail.com",
    "daniel.opazo@hospitalhangaroa.cl"
];

export class AuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'AuthError';
    }
}

const loadUserSchema = async () => {
    const { UserSchema } = await import('@shared/schemas');
    return UserSchema;
};

export const loginWithGoogle = async (): Promise<User> => {
    const auth = await getAuthInstance();
    if (!auth) throw new AuthError("Servicio de autenticación no disponible");

    try {
        const { signInWithPopup, GoogleAuthProvider, signOut } = await import("firebase/auth");
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const email = user.email || "";

        if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
            await signOut(auth);
            throw new AuthError("Este correo no está autorizado para acceder a la aplicación.", "auth/unauthorized-email");
        }

        const appUser = {
            name: user.displayName || "Usuario Google",
            email: email,
            avatar: user.photoURL || "",
        };

        // Validate with Zod (Optional but good practice)
        const UserSchema = await loadUserSchema();
        return UserSchema.parse(appUser);

    } catch (error: any) {
        console.error("Auth Service Error:", error);
        if (error instanceof AuthError) throw error;

        let message = "Error desconocido al iniciar sesión";
        if (error.code === 'auth/popup-closed-by-user') {
            message = "Inicio de sesión cancelado por el usuario";
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

        const guestUser = {
            name: "Dr. Usuario Local",
            email: "local@medidiario.app",
            avatar: "https://ui-avatars.com/api/?name=Dr+Local&background=0D8ABC&color=fff"
        };

        const UserSchema = await loadUserSchema();
        return UserSchema.parse(guestUser);
    } catch (error: any) {
        console.error("Guest Logic Error:", error);
        return {
            name: "Dr. Usuario Local",
            email: "local@medidiario.app",
            avatar: "https://ui-avatars.com/api/?name=Dr+Local&background=0D8ABC&color=fff"
        };
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
