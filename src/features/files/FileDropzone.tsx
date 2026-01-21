import React, { useId } from 'react';
import { Upload, Loader, Clipboard } from 'lucide-react';

interface FileDropzoneProps {
    isDragging: boolean;
    isUploading: boolean;
    uploadProgress: number;
    compact?: boolean;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onClickUpload: () => void;
    onPasteClick?: () => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
    isDragging,
    isUploading,
    uploadProgress,
    compact = false,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onClickUpload,
    onPasteClick,
}) => {
    const dropzoneDescriptionId = useId();

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClickUpload();
        }
    };

    const baseClasses = compact
        ? 'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer p-3'
        : 'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer mb-2 p-6';

    const stateClasses = isDragging
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800';

    return (
        <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={onClickUpload}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-busy={isUploading}
            aria-describedby={dropzoneDescriptionId}
            className={`${baseClasses} ${stateClasses}`}
        >
            {isUploading ? (
                <div className={`text-center ${compact ? 'space-y-1' : 'space-y-2'}`}>
                    <Loader className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-blue-500 animate-spin mx-auto`} />
                    <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-blue-600 dark:text-blue-400`}>
                        {compact ? `Subiendo... (${uploadProgress}%)` : `Subiendo archivos (${uploadProgress}%)...`}
                    </p>
                </div>
            ) : (
                <div
                    className={`text-center pointer-events-none ${compact ? 'flex items-center gap-2' : 'space-y-1'}`}
                    id={dropzoneDescriptionId}
                >
                    <div
                        className={`${compact ? 'w-6 h-6' : 'w-10 h-10 mx-auto'} bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center`}
                    >
                        <Upload className={compact ? 'w-3 h-3' : 'w-5 h-5'} />
                    </div>
                    <p className={`${compact ? 'text-xs' : 'text-sm font-bold'} text-gray-${compact ? '600' : '700'} dark:text-gray-300`}>
                        {isDragging ? (compact ? 'Soltar aquí' : 'Suelta los archivos aquí') : (compact ? 'Subir archivos' : 'Subir archivos adjuntos')}
                    </p>
                    {onPasteClick && !isDragging && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onPasteClick(); }}
                            className={`flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all pointer-events-auto ${compact ? 'text-[9px] mt-0.5' : 'text-[11px] mt-2'}`}
                        >
                            <Clipboard className="w-3 h-3" />
                            PEGAR IMAGEN
                        </button>
                    )}
                    {!compact && (
                        <p className="text-xs text-gray-400 mt-1">Arrastra o haz clic (PDF, IMG, DOC)</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileDropzone;
