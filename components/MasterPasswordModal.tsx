import React, { useState } from 'react';
import { Shield, ShieldCheck } from 'lucide-react';

interface MasterPasswordModalProps {
  email: string;
  isOpen: boolean;
  onSubmit: (password: string) => Promise<void>;
}

const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({ email, isOpen, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña maestra debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(password);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'No se pudo activar la contraseña maestra.');
    } finally {
      setIsLoading(false);
      setPassword('');
      setConfirm('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wide">Seguridad avanzada</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configura tu Contraseña Maestra</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Se vincula a {email} y solo vive en esta pestaña.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña maestra</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Mínimo 8 caracteres"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Repite la contraseña"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="w-5 h-5" />
            {isLoading ? 'Guardando...' : 'Activar sesión segura'}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>La clave no se guarda en servidores ni en almacenamiento local.</p>
          <p>Si cierras o recargas la pestaña deberás ingresarla nuevamente.</p>
        </div>
      </div>
    </div>
  );
};

export default MasterPasswordModal;
