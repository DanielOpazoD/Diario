
import { signInWithPopup, GoogleAuthProvider, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from './firebaseConfig';
import { User } from '@shared/types';
import { UserSchema } from '@shared/schemas';

const ALLOWED_EMAILS = [
    "d.opazo.damiani@gmail.com",
    "danielo.opazo@hospitalhangaroa.cl"
];

export class AuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'AuthError';
    }
}

export const loginWithGoogle = async (): Promise<User> => {
    if (!auth) throw new AuthError("Servicio de autenticación no disponible");

    try {
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
        if (auth) {
            await signInAnonymously(auth);
        }

        const guestUser = {
            name: "Dr. Usuario Local",
            email: "local@medidiario.app",
            avatar: "https://ui-avatars.com/api/?name=Dr+Local&background=0D8ABC&color=fff"
        };

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
    if (auth) {
        await signOut(auth);
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    if (!auth) return () => { };

    return onAuthStateChanged(auth, (firebaseUser) => {
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
};
