import React from 'react';
import { AttachedFile } from '@shared/types';

interface FilePreviewPaneProps {
    selectedFile: AttachedFile | null;
    onOpenDetail: () => void;
}

const FilePreviewPane: React.FC<FilePreviewPaneProps> = ({ selectedFile, onOpenDetail }) => {
    return (
        <div className="hidden lg:flex flex-col gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Visor integrado</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Imágenes y PDFs</p>
                </div>
                <button
                    onClick={onOpenDetail}
                    disabled={!selectedFile}
                    className="text-xs px-2 py-1 rounded-lg border text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Abrir detalle
                </button>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                {!selectedFile && <p className="text-xs text-gray-400">Selecciona un archivo para previsualizar</p>}

                {selectedFile && (
                    <div className="w-full h-full flex items-center justify-center p-1">
                        {selectedFile.mimeType.startsWith('image/') && (
                            <img
                                src={selectedFile.driveUrl}
                                alt={selectedFile.name}
                                className="max-w-full max-h-full object-contain rounded-md shadow"
                            />
                        )}
                        {selectedFile.mimeType === 'application/pdf' && (
                            <iframe
                                src={selectedFile.driveUrl}
                                className="w-full h-full border-0 rounded-md"
                                title={selectedFile.name}
                            />
                        )}
                        {!selectedFile.mimeType.startsWith('image/') && selectedFile.mimeType !== 'application/pdf' && (
                            <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                <p>Tipo no previsualizable. Usa "Abrir detalle" para más opciones.</p>
                                <button
                                    onClick={() => window.open(selectedFile.driveUrl, '_blank')}
                                    className="text-blue-600 dark:text-blue-300 underline"
                                >
                                    Ver archivo
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilePreviewPane;
