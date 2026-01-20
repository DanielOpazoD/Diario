import React from 'react';
import { Star } from 'lucide-react';
import { AttachedFile } from '@shared/types';
import { formatFileDate, displayFileName } from './fileUtils';

interface StarredFilesSectionProps {
    starredFiles: AttachedFile[];
    onSelectFile: (file: AttachedFile) => void;
}

const StarredFilesSection: React.FC<StarredFilesSectionProps> = ({ starredFiles, onSelectFile }) => {
    if (starredFiles.length === 0) return null;

    return (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-100 text-xs font-semibold uppercase">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> Destacados del paciente
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {starredFiles.map((file) => (
                    <button
                        key={file.id}
                        onClick={() => onSelectFile(file)}
                        className="min-w-[140px] text-left bg-white/80 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-lg p-2 shadow-sm hover:shadow-md transition"
                    >
                        <p className="text-xs font-bold text-gray-800 dark:text-amber-50 truncate">{displayFileName(file.name)}</p>
                        <p className="text-[10px] text-gray-500 dark:text-amber-100/80 truncate">
                            {formatFileDate(file.uploadedAt)}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StarredFilesSection;
