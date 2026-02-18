import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import useAppStore from '@core/stores/useAppStore';
import { useAppActions } from '@core/app/state/useAppActions';
import { logEvent } from '@use-cases/logger';

const ConnectionStatus: React.FC = () => {
    const user = useAppStore((state) => state.user);
    const syncStatus = useAppStore((state) => state.syncStatus);
    const lastSyncAt = useAppStore((state) => state.lastSyncAt);
    const { addToast } = useAppActions();

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleReconnect = useCallback(async () => {
        if (isReconnecting) return;
        setIsReconnecting(true);
        try {
            const { loginWithGoogle } = await import('@use-cases/auth');
            await loginWithGoogle();
            // We don't necessarily need to call login(refreshedUser) if the store 
            // is already listening to auth changes via useFirebaseSync, 
            // but it doesn't hurt to be explicit if we have access to it.
            // However, useFirebaseSync handles the state update via subscribeToAuthChanges.
            addToast('success', 'Sesión reestablecida correctamente');
            logEvent('info', 'Auth', 'Manual reconnection successful');
        } catch (error: unknown) {
            logEvent('error', 'Auth', 'Manual reconnection failed', { error: String(error) });
            const errorMsg = error instanceof Error ? error.message : 'Error al reconectar';
            addToast('error', errorMsg);
        } finally {
            setIsReconnecting(false);
        }
    }, [addToast, isReconnecting]);

    if (!isOnline) {
        return (
            <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest animate-pulse w-fit mx-auto">
                <WifiOff className="w-3 h-3" />
                Offline
            </div>
        );
    }

    if (!user) {
        return (
            <button
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm w-fit mx-auto"
            >
                <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
                Reconectar
            </button>
        );
    }

    return (
        <div className="group relative flex items-center justify-center">
            <div className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 text-[9px] font-black uppercase tracking-widest w-fit mx-auto ${syncStatus === 'synced'
                ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30 text-green-600 dark:text-green-400'
                : syncStatus === 'saving'
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 animate-pulse'
                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400'
                }`}>
                {syncStatus === 'synced' ? (
                    <CheckCircle2 className="w-3 h-3" />
                ) : syncStatus === 'saving' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                    <CloudOff className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">
                    {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'saving' ? 'Guardando...' : 'Pendiente'}
                </span>
            </div>

            {lastSyncAt && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-gray-900 text-white text-[8px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl font-bold">
                    Última sincronización: {new Date(lastSyncAt).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};

export default React.memo(ConnectionStatus);
