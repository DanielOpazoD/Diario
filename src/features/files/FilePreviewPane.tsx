import { AttachedFile } from '@shared/types';
import { Calendar, FileText } from 'lucide-react';

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

            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden min-h-[160px]">
                {!selectedFile && <p className="text-xs text-gray-400">Selecciona un archivo para previsualizar</p>}

                {selectedFile && (
                    <div className="w-full h-full flex items-center justify-center p-1">
                        {selectedFile.mimeType.startsWith('image/') && (
                            <img
                                src={selectedFile.driveUrl}
                                alt={selectedFile.customTitle || selectedFile.name}
                                className="max-w-full max-h-full object-contain rounded-md shadow"
                            />
                        )}
                        {selectedFile.mimeType === 'application/pdf' && (
                            <iframe
                                src={selectedFile.driveUrl}
                                className="w-full h-full border-0 rounded-md"
                                title={selectedFile.customTitle || selectedFile.name}
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

            {selectedFile && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-col gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                        {selectedFile.customTitle || selectedFile.name}
                    </p>

                    {selectedFile.noteDate && (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
                            <Calendar className="w-3 h-3" />
                            FECHA DE NOTA: {selectedFile.noteDate}
                        </div>
                    )}

                    {selectedFile.description && (
                        <div className="flex items-start gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 mt-1">
                            <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed italic font-medium">
                                {selectedFile.description}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilePreviewPane;
