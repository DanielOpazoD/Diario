import React from 'react';

interface ViewPreferencesSettingsProps {
    highlightPendingPatients: boolean;
    onSetHighlightPendingPatients: (value: boolean) => void;
    compactStats: boolean;
    onSetCompactStats: (value: boolean) => void;
}

const ViewPreferencesSettings: React.FC<ViewPreferencesSettingsProps> = ({
    highlightPendingPatients,
    onSetHighlightPendingPatients,
    compactStats,
    onSetCompactStats,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Preferencias de vista</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Ajusta densidad y resaltes para la agenda y estadísticas.
            </p>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Resaltar pendientes
                        </p>
                        <p className="text-xs text-gray-500">Enmarca pacientes con tareas abiertas.</p>
                    </div>
                    <button
                        onClick={() => onSetHighlightPendingPatients(!highlightPendingPatients)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${highlightPendingPatients ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        aria-pressed={highlightPendingPatients}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${highlightPendingPatients ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Estadísticas compactas
                        </p>
                        <p className="text-xs text-gray-500">Reduce tipografía y espacios en paneles.</p>
                    </div>
                    <button
                        onClick={() => onSetCompactStats(!compactStats)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${compactStats ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        aria-pressed={compactStats}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compactStats ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewPreferencesSettings;
