// ... imports ...
import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import useAppStore from '@core/stores/useAppStore';
import { logEvent } from '@use-cases/logger';

const Login: React.FC = () => {
  // Store Actions
  const login = useAppStore(state => state.login);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { loginWithGoogle } = await import('@use-cases/auth');
      const user = await loginWithGoogle();
      login(user); // Store handles persistence if needed, or we rely on session
    } catch (e: any) {
      logEvent('error', 'Auth', 'Login Error', { error: e });
      setError(e.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
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

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 animate-fade-in">
                <p className="text-xs text-center text-red-600 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}


            <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Privacidad Total:</strong> Los datos se guardan en tu navegador y se sincronizan de forma segura.
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
