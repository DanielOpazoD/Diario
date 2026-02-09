import React from 'react';
import useAppStore from '@core/stores/useAppStore';
import { Button } from '@core/ui';

interface PatientModalFooterProps {
    onCancel: () => void;
    onSave: () => void;
    saveLabel?: string;
    cancelLabel?: string;
    showSave?: boolean;
}

const PatientModalFooter: React.FC<PatientModalFooterProps> = ({
    onCancel,
    onSave,
    saveLabel = 'Guardar Ficha',
    cancelLabel = 'Cancelar',
    showSave = true,
}) => {
    const { syncStatus, lastSyncAt } = useAppStore(state => ({
        syncStatus: state.syncStatus,
        lastSyncAt: state.lastSyncAt,
    }));

    const syncLabel = syncStatus === 'saving'
        ? 'Guardando...'
        : syncStatus === 'error'
            ? 'Error al guardar'
            : syncStatus === 'synced'
                ? 'Sincronizado'
                : 'Sin cambios';

    return (
        <div className="flex justify-end gap-3 px-5 md:px-7 py-4 border-t border-gray-100/30 dark:border-gray-800/30 bg-white/20 dark:bg-gray-900/20 shrink-0 z-20 backdrop-blur-md">
            <button
                type="button"
                title={lastSyncAt ? `Última sincronización: ${new Date(lastSyncAt).toLocaleTimeString()}` : 'Estado de sincronización'}
                className={`flex items-center gap-2 px-3 h-10 rounded-xl text-[11px] font-bold tracking-widest uppercase border transition-colors ${
                    syncStatus === 'saving'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : syncStatus === 'error'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : syncStatus === 'synced'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
            >
                {syncStatus === 'saving' && (
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin"></span>
                )}
                {syncLabel}
            </button>
            <Button variant="ghost" onClick={onCancel} className="flex-1 md:flex-none h-10 px-6 font-black tracking-widest text-[11px]">
                {cancelLabel}
            </Button>
            {showSave && (
                <Button onClick={onSave} className="flex-1 md:flex-none px-8 shadow-premium-lg shadow-brand-500/30 h-10 bg-brand-500 font-black uppercase tracking-widest text-[11px] transition-all hover:shadow-premium-xl active:scale-95">
                    {saveLabel}
                </Button>
            )}
        </div>
    );
};

export default React.memo(PatientModalFooter);
