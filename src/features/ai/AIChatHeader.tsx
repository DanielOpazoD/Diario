import React from 'react';
import { ChevronDown, ChevronUp, Sparkles, Trash2, X } from 'lucide-react';

interface AIChatHeaderProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClear: () => void;
    onClose: () => void;
}

const AIChatHeader: React.FC<AIChatHeaderProps> = ({
    isExpanded,
    onToggleExpand,
    onClear,
    onClose,
}) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/50 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                    <p className="text-sm font-semibold">Asistente IA</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Gemini · Archivos + chat seguro</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onClear}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    title="Limpiar conversación"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
                <button
                    onClick={onToggleExpand}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    aria-label="Alternar tamaño"
                >
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    aria-label="Cerrar"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default AIChatHeader;
