import React from 'react';
import { Star } from 'lucide-react';
import { AttachedFile } from '@shared/types';
import { formatFileSize, formatFileDate, displayFileName, getFileIcon } from './fileUtils';

interface FileGridProps {
    files: AttachedFile[];
    onSelectFile: (file: AttachedFile) => void;
}

const FileGrid: React.FC<FileGridProps> = ({ files, onSelectFile }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {files.map((file) => (
                <div
                    key={file.id}
                    onClick={() => onSelectFile(file)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-400 cursor-pointer transition-all hover:shadow-md"
                >
                    {file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                            {getFileIcon(file.mimeType)}
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-xs font-bold truncate">{displayFileName(file.name)}</p>
                        <div className="flex items-center gap-2 text-white/70 text-[10px]">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatFileDate(file.uploadedAt)}</span>
                        </div>
                    </div>

                    {file.isStarred && (
                        <div className="absolute top-2 right-2">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FileGrid;
