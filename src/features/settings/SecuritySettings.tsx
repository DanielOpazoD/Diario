import React, { useState, useEffect } from 'react';
import { Lock, Timer, Trash2 } from 'lucide-react';
import { Button } from '@core/ui';

interface SecuritySettingsProps {
    securityPin: string | null;
    autoLockMinutes: number;
    onSetSecurityPin: (pin: string | null) => void;
    onSetAutoLockMinutes: (minutes: number) => void;
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AUTO_LOCK_OPTIONS = [0, 1, 3, 5, 10, 15, 30];

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
    securityPin,
    autoLockMinutes,
    onSetSecurityPin,
    onSetAutoLockMinutes,
    addToast,
}) => {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [lockMinutes, setLockMinutes] = useState(autoLockMinutes);

    useEffect(() => {
        setLockMinutes(autoLockMinutes);
    }, [autoLockMinutes]);

    const handleSavePin = () => {
        if (newPin.length < 4) {
            addToast('error', 'El PIN debe tener al menos 4 dígitos');
            return;
        }

        if (newPin !== confirmPin) {
            addToast('error', 'Los PIN ingresados no coinciden');
            return;
        }

        onSetSecurityPin(newPin);
        setNewPin('');
        setConfirmPin('');
        addToast('success', 'PIN de bloqueo actualizado');
    };

    const handleRemovePin = () => {
        onSetSecurityPin(null);
        setNewPin('');
        setConfirmPin('');
        addToast('info', 'Bloqueo con PIN desactivado');
    };

    const handleAutoLockChange = (minutes: number) => {
        setLockMinutes(minutes);
        onSetAutoLockMinutes(minutes);
        addToast(
            'info',
            minutes > 0 ? 'Tiempo de bloqueo actualizado' : 'Bloqueo automático desactivado'
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 col-span-1 md:col-span-2">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                        <Lock className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Seguridad y Bloqueo</h3>
                        <p className="text-xs text-gray-500">Configura el PIN y el tiempo de bloqueo automático.</p>
                    </div>
                </div>
                <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border ${securityPin
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/50'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/50'
                        }`}
                >
                    <Lock className="w-4 h-4" />
                    {securityPin ? 'PIN activo' : 'PIN desactivado'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nuevo PIN</label>
                        <input
                            type="password"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="Mínimo 4 dígitos"
                            autoComplete="new-password"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                            Confirmar PIN
                        </label>
                        <input
                            type="password"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            placeholder="Repite tu PIN"
                            autoComplete="new-password"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={handleSavePin}
                            disabled={!newPin || !confirmPin}
                            icon={<Lock className="w-4 h-4" />}
                            size="sm"
                        >
                            Guardar PIN
                        </Button>
                        {securityPin && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleRemovePin}
                                icon={<Trash2 className="w-4 h-4" />}
                            >
                                Quitar PIN
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                        Tiempo de bloqueo
                    </label>
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-200">
                            <Timer className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <select
                                value={lockMinutes}
                                onChange={(e) => handleAutoLockChange(Number(e.target.value))}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                            >
                                {AUTO_LOCK_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt === 0 ? 'Nunca (desactivado)' : `${opt} ${opt === 1 ? 'minuto' : 'minutos'}`}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                El bloqueo automático requiere tener un PIN activo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
