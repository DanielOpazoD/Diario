
import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { checkGoogleConfig, initGoogleApi } from '../services/googleService';
import { User } from '../types';
import useAppStore from '../stores/useAppStore';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "../services/firebaseConfig";

const Login: React.FC = () => {
  // Store Actions
  const login = useAppStore(state => state.login);

  const [isConfigured] = useState(checkGoogleConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize GAPI on mount
  React.useEffect(() => {
    if (isConfigured) {
      initGoogleApi(() => console.log('Google API Ready'));
    }
  }, [isConfigured]);



  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth not initialized");

      const provider = new GoogleAuthProvider();
      // Add scopes needed for Google Drive
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('openid');

      const result = await signInWithPopup(auth, provider);

      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (token) {
        sessionStorage.setItem('google_access_token', token);
      }

      const user = result.user;
      const email = user.email || "";
      const ALLOWED_EMAILS = [
        "d.opazo.damiani@gmail.com",
        "danielo.opazo@hospitalhangaroa.cl"
      ];

      if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
        await auth.signOut();
        throw new Error("Este correo no está autorizado para acceder a la aplicación.");
      }

      // Map Firebase User to App User
      const appUser: User = {
        name: user.displayName || "Usuario Google",
        email: email,
        avatar: user.photoURL || "",
      };

      login(appUser);
    } catch (e: any) {
      console.error("Login Error:", e);
      let errorMsg = "No se pudo iniciar sesión.";
      if (e?.code === 'auth/popup-closed-by-user') {
        errorMsg = "Cancelaste el inicio de sesión.";
      } else {
        errorMsg = e?.message || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      if (auth) {
        await signInAnonymously(auth);
      }

      login({
        name: "Dr. Usuario Local",
        email: "local@medidiario.app",
        avatar: "https://ui-avatars.com/api/?name=Dr+Local&background=0D8ABC&color=fff"
      });
    } catch (e) {
      console.error("Anonymous Auth Error", e);
      // Fallback to local login anyway
      login({
        name: "Dr. Usuario Local",
        email: "local@medidiario.app",
        avatar: "https://ui-avatars.com/api/?name=Dr+Local&background=0D8ABC&color=fff"
      });
    }
  };

  return (
    <div className="min-h-screen w-full mesh-bg flex items-center justify-center p-4 transition-all duration-500 relative overflow-hidden">

      <div className="w-full max-w-md z-10">
        <div className="glass-panel rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl border border-white/20">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-6">
              <img
                src="/icon.svg"
                alt="MediDiario icon"
                className="w-10 h-10 drop-shadow-md"
                loading="lazy"
                decoding="async"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">MediDiario AI</h1>
            <p className="text-gray-500 dark:text-gray-300">Gestión clínica simplificada</p>
          </div>

          <div className="space-y-4">
            {!isConfigured ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Falta configurar <strong>VITE_GOOGLE_CLIENT_ID</strong> en tus variables de entorno de Netlify.
                    </p>
                    <button
                      onClick={handleGuestLogin}
                      className="mt-2 text-sm font-bold text-yellow-800 underline"
                    >
                      Entrar como Invitado (Sin Drive)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> Conectando...</span>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 mr-2" alt="G" />
                    Iniciar con Google
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 animate-fade-in">
                <p className="text-xs text-center text-red-600 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {isConfigured && (
              <button
                onClick={handleGuestLogin}
                className="w-full py-3 px-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Continuar sin cuenta (Solo Local)
              </button>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Privacidad Total:</strong> Los datos de pacientes se guardan en tu navegador. Al conectar Google, tú controlas el respaldo en tu propio Drive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
