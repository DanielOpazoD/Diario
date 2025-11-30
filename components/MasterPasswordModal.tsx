import React, { useCallback, useMemo, useState } from 'react';
import { Lock, Shield, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

const MasterPasswordModal: React.FC = () => {
  const { status, hasProfile, setMasterPassword, unlockWithMasterPassword, userEmail } = useSecurity();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isVisible = useMemo(
    () => Boolean(userEmail) && status !== 'ready' && status !== 'checking',
    [status, userEmail]
  );

  const isSetupStep = status === 'needs-setup' || (!hasProfile && status === 'requires-unlock');

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError('');
      setIsLoading(true);

      try {
        if (isSetupStep) {
          if (!password || password.length < 8) {
            setError('La Contraseña Maestra debe tener al menos 8 caracteres.');
            setIsLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setIsLoading(false);
            return;
          }
          await setMasterPassword(password);
        } else {
          const success = await unlockWithMasterPassword(password);
          if (!success) {
            setError('Contraseña incorrecta. Intenta nuevamente.');
          }
        }
        setPassword('');
        setConfirmPassword('');
      } catch (e) {
        console.error('No se pudo procesar la contraseña maestra', e);
        setError('Ocurrió un error al guardar tu Contraseña Maestra.');
      } finally {
        setIsLoading(false);
      }
    },
    [confirmPassword, isSetupStep, password, setMasterPassword, unlockWithMasterPassword]
  );

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">
            {isSetupStep ? <Shield className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wide">Seguridad unificada</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isSetupStep ? 'Crea tu Contraseña Maestra' : 'Ingresa tu Contraseña Maestra'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Se usa para cifrar respaldos y desbloquear la sesión segura de {userEmail}.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña Maestra</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Frase larga y segura"
              autoFocus
            />
          </div>

          {isSetupStep && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repetir Contraseña Maestra</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Vuelve a escribirla"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || (!password || (isSetupStep && !confirmPassword))}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl font-semibold transition-colors"
          >
            {isSetupStep ? <ShieldCheck className="w-5 h-5" /> : <ShieldQuestion className="w-5 h-5" />}
            {isSetupStep ? 'Guardar Contraseña Maestra' : 'Desbloquear sesión segura'}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Solo vive en la memoria mientras esta pestaña esté abierta.</p>
          <p>• Se usa para cifrar tus respaldos en Google Drive.</p>
          <p>• Si recargas la página, tendrás que ingresarla nuevamente.</p>
        </div>
      </div>
    </div>
  );
};

export default MasterPasswordModal;
