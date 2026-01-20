import React from 'react';
import { Sparkles, Grid, List, Star } from 'lucide-react';

interface FileManagerHeaderProps {
    fileCount: number;
    hasFiles: boolean;
    viewMode: 'list' | 'grid';
    showStarredOnly: boolean;
    onOpenAIPanel: () => void;
    onViewModeChange: (mode: 'list' | 'grid') => void;
    onToggleStarredOnly: () => void;
}

const FileManagerHeader: React.FC<FileManagerHeaderProps> = ({
    fileCount,
    hasFiles,
    viewMode,
    showStarredOnly,
    onOpenAIPanel,
    onViewModeChange,
    onToggleStarredOnly,
}) => {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Archivos Adjuntos ({fileCount})</h3>
                    <p className="text-xs text-gray-500">Previsualiza y organiza rápidamente</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {hasFiles && (
                        <button
                            onClick={onOpenAIPanel}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-full text-xs font-bold shadow-md transition-all transform hover:scale-105"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Asistente IA
                        </button>
                    )}
                    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            title="Vista de cuadrícula"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            title="Vista de lista"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                    onClick={onToggleStarredOnly}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] transition-colors ${showStarredOnly
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-100'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                >
                    <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-yellow-400 text-yellow-500' : 'text-gray-400'}`} />
                    Solo destacados
                </button>
            </div>
        </div>
    );
};

export default FileManagerHeader;
