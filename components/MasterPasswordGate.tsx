import React, { useMemo, useState } from 'react';
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react';

interface MasterPasswordGateProps {
  hasMasterPassword: boolean;
  onCreate: (password: string) => Promise<boolean>;
  onUnlock: (password: string) => Promise<boolean>;
}

const MasterPasswordGate: React.FC<MasterPasswordGateProps> = ({ hasMasterPassword, onCreate, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const isStrong = useMemo(() => password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsBusy(true);

    try {
      if (!hasMasterPassword) {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden.');
          return;
        }

        if (!isStrong) {
          setError('Usa al menos 8 caracteres, una mayúscula y un número.');
          return;
        }

        const created = await onCreate(password);
        if (!created) {
          setError('No se pudo establecer la contraseña.');
        }
      } else {
        const unlocked = await onUnlock(password);
        if (!unlocked) {
          setError('Contraseña incorrecta.');
        }
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full mesh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">Seguridad avanzada</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {hasMasterPassword ? 'Desbloquea con Contraseña Maestra' : 'Crea tu Contraseña Maestra'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña Maestra</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Ingresa tu contraseña"
                autoFocus
              />
              {!hasMasterPassword && (
                <p className="text-xs text-gray-500 mt-1">Usa una frase larga, con mayúsculas, números y símbolos.</p>
              )}
            </div>

            {!hasMasterPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Repite la contraseña"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-70"
            >
              {hasMasterPassword ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
              {hasMasterPassword ? 'Desbloquear sesión' : 'Guardar y continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MasterPasswordGate;
