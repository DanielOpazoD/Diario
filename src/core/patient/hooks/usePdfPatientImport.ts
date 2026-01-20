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
        const file = e.target.files?.[0];
        if (!file || file.type !== 'application/pdf') {
            if (file) addToast('error', 'Por favor selecciona un archivo PDF');
            return;
        }

        setIsImporting(true);
        try {
            // 1. Convertir a Base64 para Gemini
            const base64 = await fileToBase64(file);

            // 2. Extraer datos con Gemini
            addToast('info', 'Analizando PDF con IA...');
            const extractedData = await extractPatientDataFromImage(base64, file.type);

            // Zod Validation for Extracted Data
            // We create a mini-schema for what we expect from the AI at minimum
            const ExtractedDataSchema = z.object({
                name: z.string().optional(),
                rut: z.string().optional(),
                birthDate: z.string().optional(),
                gender: z.string().optional(),
            });

            const validation = ExtractedDataSchema.safeParse(extractedData);

            if (!validation.success || (!extractedData?.name && !extractedData?.rut)) {
                throw new Error('No se pudieron extraer datos válidos del PDF');
            }

            // 3. Crear nuevo registro de paciente
            const newPatient: Omit<PatientRecord, 'id' | 'createdAt'> = {
                name: extractedData.name ? formatPatientName(extractedData.name) : 'Paciente Nuevo',
                rut: extractedData.rut || '',
                birthDate: extractedData.birthDate || '',
                gender: extractedData.gender || '',
                type: PatientType.POLICLINICO, // Valor por defecto
                diagnosis: 'Importado desde PDF',
                clinicalNote: '',
                date: format(currentDate, 'dd-MM-yyyy'),
                attachedFiles: [],
                pendingTasks: [],
            };

            // Guardar paciente y obtener su ID (el store genera el ID)
            // Nota: addPatient en useAppStore devuelve el paciente creado o al menos lo añade al estado
            // Como el store es reactivo y usa sincronización, necesitamos el ID para el archivo.

            const tempId = crypto.randomUUID();
            const patientWithId: PatientRecord = {
                ...newPatient,
                id: tempId,
                createdAt: Date.now()
            };

            addPatient(patientWithId);

            // 4. Subir PDF a Firebase Storage
            addToast('info', 'Subiendo archivo original...');
            const attachedFile = await uploadFileToFirebase(file, tempId);

            // 5. Vincular archivo al paciente
            const updatedPatient = {
                ...patientWithId,
                attachedFiles: [attachedFile]
            };

            updatePatient(updatedPatient);

            addToast('success', `Paciente ${updatedPatient.name} creado e importado con éxito`);

        } catch (error: any) {
            console.error('Error importing PDF:', error);
            addToast('error', error.message || 'Error al importar el PDF');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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
