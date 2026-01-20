import { useRef, useState } from 'react';
import { z } from 'zod';
import { extractPatientDataFromImage } from '@services/geminiService';
import { fileToBase64 } from '@services/storage';
import { uploadFileToFirebase } from '@services/firebaseStorageService';
import { useAppActions } from '@core/app/state/useAppActions';
import { PatientRecord, PatientType } from '@shared/types';
import { formatPatientName } from '@core/patient/utils/patientUtils';
import { format } from 'date-fns';

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
                // 1. Convertir a Base64 para Gemini
                const base64 = await fileToBase64(file);

                // 2. Extraer datos con Gemini
                const extractedData: any = await extractPatientDataFromImage(base64, file.type);

                // Zod Validation for Extracted Data
                const ExtractedDataSchema = z.object({
                    name: z.string().optional(),
                    rut: z.string().optional(),
                    birthDate: z.string().optional(),
                    gender: z.string().optional(),
                });

                const validation = ExtractedDataSchema.safeParse(extractedData);

                if (!validation.success || (!extractedData?.name && !extractedData?.rut)) {
                    throw new Error(`No se pudieron extraer datos válidos de ${file.name}`);
                }

                // 3. Crear nuevo registro de paciente
                const tempId = crypto.randomUUID();
                const now = Date.now();
                const newPatient: PatientRecord = {
                    id: tempId,
                    name: extractedData.name ? formatPatientName(extractedData.name) : 'Paciente Nuevo',
                    rut: extractedData.rut || '',
                    birthDate: extractedData.birthDate || '',
                    gender: extractedData.gender || '',
                    type: PatientType.POLICLINICO,
                    diagnosis: 'Importado desde PDF',
                    clinicalNote: '',
                    date: format(currentDate, 'yyyy-MM-dd'),
                    attachedFiles: [],
                    pendingTasks: [],
                    createdAt: now,
                    updatedAt: now,
                };

                addPatient(newPatient);

                // 4. Subir PDF a Firebase Storage
                const attachedFile = await uploadFileToFirebase(file, tempId);

                // 5. Vincular archivo al paciente
                const updatedPatient = {
                    ...newPatient,
                    attachedFiles: [attachedFile],
                    updatedAt: Date.now()
                };

                updatePatient(updatedPatient);
                successCount++;

            } catch (error: any) {
                console.error(`Error importing PDF ${file.name}:`, error);
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
