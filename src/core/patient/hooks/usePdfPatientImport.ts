import { useCallback, useRef, useState } from 'react';
import {
    extractPatientDataFromImageAI,
    extractPatientDataFromTextAI,
    normalizeExtractedPatientDataUseCase,
    extractAndNormalizePatientText,
    mergeExtractedFieldsUseCase,
} from '@use-cases/patient/extraction';
import { encodeFileToBase64, extractTextFromPdfFile, uploadPatientFile } from '@use-cases/attachments';
import { logEvent } from '@use-cases/logger';
import useAppStore from '@core/stores/useAppStore';
import { ExtractedPatientData, PatientRecord } from '@shared/types';
import { createImportedPatientRecord } from '@use-cases/patient/createImportedPatient';
import { isMissingCoreExtractedFields } from '@use-cases/patient/validation';

export const usePdfPatientImport = (currentDate: Date) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const addToast = useAppStore((state) => state.addToast);
    const addPatient = useAppStore((state) => state.addPatient);
    const updatePatient = useAppStore((state) => state.updatePatient);

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
                let extractedData: Partial<ExtractedPatientData> | null = null;

                if (file.type === 'application/pdf') {
                    let mergedExtracted: Partial<ExtractedPatientData> = {};
                    let extractedText = '';

                    try {
                        const buffer = await file.arrayBuffer();
                        extractedText = await extractTextFromPdfFile(buffer);
                    } catch (_error) {
                        addToast('info', 'No se pudo leer texto del PDF. Probando extracción IA directa.');
                    }

                    if (extractedText.trim()) {
                        const localExtracted = extractAndNormalizePatientText(extractedText);
                        mergedExtracted = mergeExtractedFieldsUseCase(mergedExtracted, localExtracted);

                        if (isMissingCoreExtractedFields(mergedExtracted)) {
                            try {
                                const aiFromText = await extractPatientDataFromTextAI(extractedText);
                                mergedExtracted = mergeExtractedFieldsUseCase(
                                    mergedExtracted,
                                    normalizeExtractedPatientDataUseCase(aiFromText || {}),
                                );
                            } catch (_error) {
                                addToast('info', 'IA por texto no disponible. Probando extracción directa desde PDF.');
                            }
                        }
                    }

                    if (isMissingCoreExtractedFields(mergedExtracted)) {
                        try {
                            const base64 = await encodeFileToBase64(file);
                            const aiFromPdf = await extractPatientDataFromImageAI(base64, file.type || 'application/pdf');
                            mergedExtracted = mergeExtractedFieldsUseCase(
                                mergedExtracted,
                                normalizeExtractedPatientDataUseCase(aiFromPdf || {}),
                            );
                        } catch (_error) {
                            addToast('info', 'No fue posible extraer datos por IA directa desde PDF.');
                        }
                    }

                    extractedData = mergedExtracted;
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

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                logEvent('error', 'Imports', 'PDF import failed', {
                    fileName: file.name,
                    error: message,
                });
                const isTimeout = message.includes('504') || message.includes('demasiado');
                addToast('error', `Fallo en ${file.name}: ${isTimeout ? 'Tiempo excedido (Timeout)' : message}`);
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

    const triggerPicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        fileInputRef,
        isImporting,
        handlePdfUpload,
        triggerPicker
    };
};
