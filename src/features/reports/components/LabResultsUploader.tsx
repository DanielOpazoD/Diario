import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { extractLabResultsUseCase } from '@use-cases/patient/extractLabResultsUseCase';
import type { AttachedFile } from '@shared/types';

interface LabResultsUploaderProps {
    patientId?: string;
    onExtractionComplete: (text: string) => void;
    uploadPatientFile: (file: File, patientId: string) => Promise<AttachedFile>;
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const LabResultsUploader: React.FC<LabResultsUploaderProps> = ({
    patientId,
    onExtractionComplete,
    uploadPatientFile,
    addToast,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        const fileList = Array.from(files);

        try {
            let combinedResults = '';

            for (const file of fileList) {
                // 1. Optional: Upload to Firebase if patientId exists
                if (patientId) {
                    try {
                        await uploadPatientFile(file, patientId);
                    } catch (error) {
                        console.error('File upload failed but continuing with extraction:', error);
                        addToast('info', `No se pudo guardar ${file.name} en la nube, pero intentaremos extraer los datos.`);
                    }
                }

                // 2. Extract with IA
                const result = await extractLabResultsUseCase(file);
                combinedResults += (combinedResults ? '\n\n' : '') + result;
            }

            if (combinedResults) {
                onExtractionComplete(combinedResults);
                addToast('success', 'Resultados de laboratorio extraídos con éxito.');
            }
        } catch (error) {
            console.error('Extraction failed:', error);
            addToast('error', 'Ocurrió un error al procesar los archivos de laboratorio.');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="lab-uploader inline-flex align-middle">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf,image/*"
                multiple
                className="hidden"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50"
            >
                {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <FileUp className="w-3.5 h-3.5" />
                )}
                {isProcessing ? 'Procesando...' : 'Subir Laboratorios (IA)'}
            </button>
        </div>
    );
};

export default LabResultsUploader;
