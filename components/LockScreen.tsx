import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (pin: string) => boolean;
  autoLockMinutes: number;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, autoLockMinutes }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlock(pin);
    if (!success) {
      setError('PIN incorrecto. Intenta nuevamente.');
      setPin('');
    } else {
      setError('');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wide">Pantalla bloqueada</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ingresa tu PIN</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PIN de seguridad</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="••••"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            Desbloquear
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
          La pantalla se bloquea automáticamente tras {autoLockMinutes} {autoLockMinutes === 1 ? 'minuto' : 'minutos'} sin actividad.
        </p>
      </div>
    </div>
  );
};

export default LockScreen;
