import React, { useMemo, useState } from 'react';
import { Shield, ShieldCheck, LockKeyhole, Info } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { deriveEncryptionKey, generateSalt, hashPassword, verifyPassword } from '../services/securityService';
import Button from './Button';

const MIN_LENGTH = 12;

const MasterPasswordGate: React.FC = () => {
  const masterPasswordSalt = useAppStore((state) => state.masterPasswordSalt);
  const masterPasswordHash = useAppStore((state) => state.masterPasswordHash);
  const setMasterPasswordData = useAppStore((state) => state.setMasterPasswordData);
  const setMasterUnlocked = useAppStore((state) => state.setMasterUnlocked);
  const setMasterKey = useAppStore((state) => state.setMasterKey);
  const logout = useAppStore((state) => state.logout);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isConfigured = Boolean(masterPasswordHash && masterPasswordSalt);
  const canSubmit = useMemo(() => {
    if (isProcessing) return false;
    if (isConfigured) return password.length > 0;
    return password.length >= MIN_LENGTH && password === confirmPassword;
  }, [confirmPassword, isConfigured, isProcessing, password]);

  const handleCreate = async () => {
    setError('');
    setIsProcessing(true);
    try {
      const salt = generateSalt();
      const hash = await hashPassword(password, salt);
      const key = await deriveEncryptionKey(password, salt);
      setMasterPasswordData(salt, hash);
      setMasterKey(key);
      setMasterUnlocked(true);
    } catch (e: any) {
      console.error(e);
      setError('No pudimos guardar la contraseña maestra.');
    } finally {
      setIsProcessing(false);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleUnlock = async () => {
    if (!masterPasswordSalt || !masterPasswordHash) return;
    setError('');
    setIsProcessing(true);
    try {
      const isValid = await verifyPassword(password, masterPasswordSalt, masterPasswordHash);
      if (!isValid) {
        setError('Contraseña incorrecta.');
        return;
      }
      const key = await deriveEncryptionKey(password, masterPasswordSalt);
      setMasterKey(key);
      setMasterUnlocked(true);
    } catch (e: any) {
      console.error(e);
      setError('No pudimos validar la contraseña.');
    } finally {
      setIsProcessing(false);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isConfigured) {
      handleUnlock();
    } else {
      handleCreate();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-white space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30">
            <Shield className="w-6 h-6 text-indigo-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/80 font-semibold">Acceso protegido</p>
            <h1 className="text-2xl font-bold">{isConfigured ? 'Desbloquear con Contraseña Maestra' : 'Configurar Contraseña Maestra'}</h1>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-start gap-3 text-sm text-slate-200">
          <Info className="w-5 h-5 text-indigo-200 mt-0.5" />
          <p>
            Usa una contraseña robusta para iniciar sesión y cifrar los respaldos (.json) que se suben a la nube.
            Los adjuntos se mantienen sin cifrar por ahora. El PIN seguirá funcionando para desbloquear la pantalla tras periodos de inactividad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-indigo-100 mb-2">Contraseña Maestra</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder={isConfigured ? 'Ingresa tu contraseña' : `Mínimo ${MIN_LENGTH} caracteres`}
              autoFocus
            />
          </div>

          {!isConfigured && (
            <div>
              <label className="block text-sm font-semibold text-indigo-100 mb-2">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Repite tu contraseña"
              />
              <p className="text-xs text-slate-300 mt-2">Se usará para cifrar los respaldos automáticos en Google Drive.</p>
            </div>
          )}

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <Button
            type="submit"
            icon={isConfigured ? <LockKeyhole className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
            disabled={!canSubmit}
            loading={isProcessing}
          >
            {isConfigured ? 'Desbloquear' : 'Guardar contraseña'}
          </Button>

          {isConfigured && (
            <button
              type="button"
              onClick={() => logout()}
              className="w-full text-xs text-center text-indigo-200/80 underline"
            >
              Salir y cambiar de usuario
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default MasterPasswordGate;
