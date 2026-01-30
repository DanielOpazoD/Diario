import React from 'react';
import { Trash2, ExternalLink, Star, Calendar, FileText } from 'lucide-react';
import { AttachedFile } from '@shared/types';
import { formatFileSize, formatFileDate, displayFileName, getFileIcon } from './fileUtils';

interface FileListProps {
    files: AttachedFile[];
    onSelectFile: (file: AttachedFile) => void;
    onDeleteFile: (fileId: string) => void;
    onToggleStar: (file: AttachedFile, e?: React.MouseEvent) => void;
}

const FileList: React.FC<FileListProps> = ({
    files,
    onSelectFile,
    onDeleteFile,
    onToggleStar,
}) => {
    return (
        <div className="space-y-1.5">
            {files.map((file) => (
                <div
                    key={file.id}
                    onClick={() => onSelectFile(file)}
                    className="group flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer"
                >
                    <div className="relative">
                        <div className="w-11 h-11 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600">
                            {file.thumbnailLink ? (
                                <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                                getFileIcon(file.mimeType)
                            )}
                        </div>
                        <button
                            onClick={(e) => onToggleStar(file, e)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-white shadow-sm text-gray-400 hover:text-yellow-500"
                            title={file.isStarred ? 'Quitar destacado' : 'Destacar'}
                        >
                            <Star className={`w-4 h-4 ${file.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={file.customTitle || file.name}>
                                {file.customTitle || displayFileName(file.name)}
                            </h4>
                            {file.noteDate && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                                    <Calendar className="w-2.5 h-2.5" /> {file.noteDate}
                                </span>
                            )}
                            {file.customTypeLabel && (
                                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-[10px] font-bold border border-gray-200 dark:border-gray-600">
                                    {file.customTypeLabel}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatFileDate(file.uploadedAt)}</span>
                        </div>
                        {file.description && (
                            <div className="flex items-start gap-1.5 mt-1">
                                <FileText className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic font-medium">
                                    {file.description}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        {file.driveUrl && (
                            <button
                                onClick={() => window.open(file.driveUrl, '_blank')}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="Ver archivo"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onDeleteFile(file.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FileList;
