import React from 'react';
import { X, Settings, Bookmark, BarChart2 } from 'lucide-react';
import { ViewMode } from '@shared/types';

interface AppMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: ViewMode) => void;
}

const AppMenuModal: React.FC<AppMenuModalProps> = ({ isOpen, onClose, onNavigate }) => {
    if (!isOpen) return null;

    const handleNavigation = (view: ViewMode) => {
        onNavigate(view);
        onClose();
    };

    const menuItems = [
        {
            id: 'settings',
            label: 'Configuración',
            icon: Settings,
            description: 'Ajustes de la aplicación',
            color: 'bg-blue-100 text-blue-600',
        },
        {
            id: 'bookmarks',
            label: 'Marcadores',
            icon: Bookmark,
            description: 'Acceso rápido a enlaces',
            color: 'bg-purple-100 text-purple-600',
        },
        {
            id: 'stats',
            label: 'Estadísticas',
            icon: BarChart2,
            description: 'Resumen de datos y métricas',
            color: 'bg-green-100 text-green-600',
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100 opacity-100"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Menú Principal</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 grid gap-3">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id as ViewMode)}
                            className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800 group text-left w-full"
                        >
                            <div className={`p-3 rounded-lg ${item.color} mr-4`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.label}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AppMenuModal;
