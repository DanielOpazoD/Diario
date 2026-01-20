import React from 'react';
import { File, FileText, Image as ImageIcon } from 'lucide-react';

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatFileDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
};

export const displayFileName = (name: string): string => {
    return name.replace(/^\d{4}-\d{2}-\d{2}_/, '');
};

export const getFileIcon = (mimeType: string): React.ReactNode => {
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
};

export const getFileColor = (mimeType: string): string => {
    if (mimeType.includes('image')) return 'bg-purple-100 dark:bg-purple-900/30';
    if (mimeType.includes('pdf')) return 'bg-red-100 dark:bg-red-900/30';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-blue-100 dark:bg-blue-900/30';
    return 'bg-gray-100 dark:bg-gray-800';
};
