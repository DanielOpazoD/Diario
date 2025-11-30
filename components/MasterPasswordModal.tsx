import React, { useState } from 'react';
import { Lock, ShieldCheck, LogOut } from 'lucide-react';

interface MasterPasswordModalProps {
  mode: 'create' | 'unlock';
  email: string;
  onSubmit: (password: string) => void;
  onLogout: () => void;
}

const MIN_LENGTH = 8;

const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({ mode, email, onSubmit, onLogout }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!password || password.length < MIN_LENGTH) {
      return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`;
    }

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return 'Usa solo caracteres alfanuméricos (A-Z, 0-9).';
    }

    if (mode === 'create' && password !== confirm) {
      return 'Las contraseñas no coinciden.';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(password);
    setError('');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wide">Seguridad unificada</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Crea tu Contraseña Maestra' : 'Ingresa tu Contraseña Maestra'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cuenta: {email}</p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl p-4 mb-5 text-sm text-purple-900 dark:text-purple-100">
          <p className="font-semibold mb-1">Protege tus respaldos</p>
          <p className="text-purple-800/80 dark:text-purple-100/80">
            Esta clave no se guarda en ningún lugar. Vivirá solo mientras esta pestaña permanezca abierta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña maestra</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Al menos 8 caracteres"
            />
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Repite la contraseña"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              Cambiar de cuenta
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
              {mode === 'create' ? 'Crear y continuar' : 'Desbloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterPasswordModal;
