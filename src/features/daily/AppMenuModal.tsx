import React from 'react';
import { X, Settings, Bookmark, BarChart2, FileText } from 'lucide-react';
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
            id: 'reports',
            label: 'Informes clínicos',
            icon: FileText,
            description: 'Epicrisis e informes médicos',
            color: 'bg-amber-100 text-amber-600',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-md" onClick={onClose}></div>
            <div
                className="relative glass rounded-panel shadow-premium-xl w-full max-w-sm overflow-hidden transform transition-all border-white/40 dark:border-white/10"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-5 border-b border-gray-100/30 dark:border-gray-800/30 flex items-center justify-between bg-white/20 dark:bg-gray-900/20 backdrop-blur-md">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Menú Principal</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 group transition-all duration-300 hover:rotate-90"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                    </button>
                </div>

                <div className="p-5 grid gap-3 bg-gray-50/10 dark:bg-gray-950/10">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id as ViewMode)}
                            className="flex items-center p-4 glass-card rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all border-none shadow-premium-sm hover:shadow-premium group text-left w-full transform hover:-translate-y-1 active:scale-95 duration-300"
                        >
                            <div className={`p-3.5 rounded-xl ${item.color.replace('100', '500/10')} group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest group-hover:text-brand-500 transition-colors">{item.label}</h3>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-tight">{item.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AppMenuModal;
