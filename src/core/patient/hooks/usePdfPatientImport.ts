import { useRef, useState } from 'react';
import {
  extractPatientDataFromImageAI,
  extractPatientDataFromTextAI,
  normalizeExtractedPatientDataUseCase,
  extractAndNormalizePatientText,
} from '@use-cases/patient/extraction';
import { encodeFileToBase64, extractTextFromPdfFile, uploadPatientFile } from '@use-cases/attachments';
import { logEvent } from '@use-cases/logger';
import { useAppActions } from '@core/app/state/useAppActions';
import { PatientRecord } from '@shared/types';
import { createImportedPatientRecord } from '@use-cases/patient/createImportedPatient';
import { isMissingCoreExtractedFields } from '@use-cases/patient/validation';

export const usePdfPatientImport = (currentDate: Date) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const { addToast, addPatient, updatePatient } = useAppActions();

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        if (pdfFiles.length === 0) {
            addToast('error', 'Por favor selecciona archivos PDF');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsImporting(true);
        let successCount = 0;
        let errorCount = 0;

        addToast('info', `Iniciando importación de ${pdfFiles.length} ${pdfFiles.length === 1 ? 'paciente' : 'pacientes'}...`);

        for (const file of pdfFiles) {
            try {
                let extractedData: any = null;

                if (file.type === 'application/pdf') {
                    const buffer = await file.arrayBuffer();
                    const text = await extractTextFromPdfFile(buffer);
                    const localExtracted = extractAndNormalizePatientText(text);
                    const isMissingCore = isMissingCoreExtractedFields(localExtracted);
                    let aiExtracted: any = null;
                    if (isMissingCore) {
                        try {
                            aiExtracted = await extractPatientDataFromTextAI(text);
                        } catch (error) {
                            addToast('info', 'IA no disponible. Usando solo extracción local del PDF.');
                        }
                    }
                    extractedData = {
                        ...localExtracted,
                        ...normalizeExtractedPatientDataUseCase(aiExtracted || {}),
                    };
                } else {
                    const base64 = await encodeFileToBase64(file);
                    extractedData = normalizeExtractedPatientDataUseCase(await extractPatientDataFromImageAI(base64, file.type) || {});
                }

                // Zod Validation for Extracted Data
                const { z } = await import('zod');
                const ExtractedDataSchema = z.object({
                    name: z.string().optional(),
                    rut: z.string().optional(),
                    birthDate: z.string().optional(),
                    gender: z.string().optional(),
                    diagnosis: z.string().optional(),
                    clinicalNote: z.string().optional(),
                });

                const validation = ExtractedDataSchema.safeParse(extractedData);

                if (!validation.success || (!extractedData?.name && !extractedData?.rut)) {
                    throw new Error(`No se pudieron extraer datos válidos de ${file.name}`);
                }

                // 3. Crear nuevo registro de paciente
                const tempId = crypto.randomUUID();
                const now = Date.now();
                const newPatient: PatientRecord = createImportedPatientRecord({
                    id: tempId,
                    extractedData,
                    currentDate,
                    timestamp: now,
                });

                if (!extractedData.diagnosis || !extractedData.clinicalNote) {
                    addToast('info', `Datos clínicos parciales en ${file.name}. Verifica el Diagnóstico y Plan.`);
                }

                addPatient(newPatient);

                // 4. Subir PDF a Firebase Storage
                const attachedFile = await uploadPatientFile(file, tempId);

                // 5. Vincular archivo al paciente
                const updatedPatient = {
                    ...newPatient,
                    attachedFiles: [attachedFile],
                    updatedAt: Date.now()
                };

                updatePatient(updatedPatient);
                successCount++;

            } catch (error: any) {
                logEvent('error', 'Imports', 'PDF import failed', {
                    fileName: file.name,
                    error,
                });
                const isTimeout = error.message?.includes('504') || error.message?.includes('demasiado');
                addToast('error', `Fallo en ${file.name}: ${isTimeout ? 'Tiempo excedido (Timeout)' : error.message}`);
                errorCount++;
            }
        }

        if (successCount > 0) {
            addToast('success', `Importados ${successCount} pacientes correctamente`);
        }
        if (errorCount > 0) {
            addToast('error', `Error al procesar ${errorCount} ${errorCount === 1 ? 'archivo' : 'archivos'}`);
        }

        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerPicker = () => {
        fileInputRef.current?.click();
    };

    return {
        fileInputRef,
        isImporting,
        handlePdfUpload,
        triggerPicker
    };
};
