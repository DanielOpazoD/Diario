import React, { useRef, useState } from 'react';
import { extractMultiplePatientsFromImage, extractPatientDataFromImage } from '@services/geminiService';
import { fileToBase64, downloadUrlAsBase64 } from '@services/storage';
import { AttachedFile, PatientRecord, PatientType } from '@shared/types';
import { formatPatientName } from '@core/patient/utils/patientUtils';

interface UsePatientDataExtractionParams {
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  selectedDate: string;
  onClose: () => void;
  onSaveMultiple?: (patients: Array<Omit<PatientRecord, 'id' | 'createdAt'>>) => void;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setRut: React.Dispatch<React.SetStateAction<string>>;
  setBirthDate: React.Dispatch<React.SetStateAction<string>>;
  setGender: React.Dispatch<React.SetStateAction<string>>;
  setDiagnosis: React.Dispatch<React.SetStateAction<string>>;
  setClinicalNote: React.Dispatch<React.SetStateAction<string>>;
}

const usePatientDataExtraction = ({
  addToast,
  selectedDate,
  onClose,
  onSaveMultiple,
  setName,
  setRut,
  setBirthDate,
  setGender,
  setDiagnosis,
  setClinicalNote,
}: UsePatientDataExtractionParams) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isScanningMulti, setIsScanningMulti] = useState(false);
  const [isExtractingFromFiles, setIsExtractingFromFiles] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const extractedData = await extractPatientDataFromImage(base64, file.type);

      if (extractedData) {
        if (extractedData.name) setName(formatPatientName(extractedData.name));
        if (extractedData.rut) setRut(extractedData.rut);
        if (extractedData.birthDate) setBirthDate(extractedData.birthDate);
        if (extractedData.gender) setGender(extractedData.gender);
        if (extractedData.diagnosis) setDiagnosis(extractedData.diagnosis);
        if (extractedData.clinicalNote) setClinicalNote(extractedData.clinicalNote);
        addToast('success', 'Datos extraídos');
      }
    } catch (error: any) {
      addToast('error', 'Error procesando imagen');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExtractFromAttachments = async (
    attachedFiles: AttachedFile[],
    currentFields: { name: string; rut: string; birthDate: string; gender: string; diagnosis: string; clinicalNote: string },
  ) => {
    if (!attachedFiles.length) {
      return addToast('info', 'Primero agrega adjuntos del paciente.');
    }

    const supportedFiles = attachedFiles.filter(file => file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf');
    if (!supportedFiles.length) {
      return addToast('info', 'Los adjuntos actuales no son compatibles (solo imágenes o PDF).');
    }



    setIsExtractingFromFiles(true);

    try {
      const updatedFields = new Set<string>();

      for (const file of supportedFiles) {
        try {
          if (!file.driveUrl) continue;
          const base64 = await downloadUrlAsBase64(file.driveUrl);
          const extractedData = await extractPatientDataFromImage(base64, file.mimeType);

          if (extractedData) {
            if (extractedData.name && extractedData.name !== currentFields.name) {
              setName(formatPatientName(extractedData.name));
              updatedFields.add('Nombre');
            }
            if (extractedData.rut && extractedData.rut !== currentFields.rut) {
              setRut(extractedData.rut);
              updatedFields.add('RUT');
            }
            if (extractedData.birthDate && extractedData.birthDate !== currentFields.birthDate) {
              setBirthDate(extractedData.birthDate);
              updatedFields.add('Nacimiento');
            }
            if (extractedData.gender && extractedData.gender !== currentFields.gender) {
              setGender(extractedData.gender);
              updatedFields.add('Género');
            }
            if (extractedData.diagnosis && extractedData.diagnosis !== currentFields.diagnosis) {
              setDiagnosis(extractedData.diagnosis);
              updatedFields.add('Diagnóstico');
            }
            if (extractedData.clinicalNote && extractedData.clinicalNote !== currentFields.clinicalNote) {
              setClinicalNote(extractedData.clinicalNote);
              updatedFields.add('Nota');
            }
          }

          if (
            updatedFields.has('Nombre') &&
            updatedFields.has('RUT') &&
            updatedFields.has('Nacimiento') &&
            updatedFields.has('Género') &&
            updatedFields.has('Diagnóstico') &&
            updatedFields.has('Nota')
          ) {
            break;
          }
        } catch (error) {
          console.error('Error extracting from file', file.name, error);
        }
      }

      if (updatedFields.size > 0) {
        addToast('success', `Datos completados desde adjuntos: ${Array.from(updatedFields).join(', ')}`);
      } else {
        addToast('info', 'No se encontraron datos identificatorios en los adjuntos.');
      }
    } finally {
      setIsExtractingFromFiles(false);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onSaveMultiple) {
      addToast('error', 'Función no disponible en este contexto');
      return;
    }

    setIsScanningMulti(true);
    try {
      const base64 = await fileToBase64(file);
      const extractedPatients = await extractMultiplePatientsFromImage(base64, file.type);

      if (extractedPatients && extractedPatients.length > 0) {
        const patientsToSave = extractedPatients.map(p => ({
          name: formatPatientName(p.name),
          rut: p.rut,
          birthDate: p.birthDate,
          gender: p.gender,
          type: PatientType.POLICLINICO,
          diagnosis: p.diagnosis || '',
          clinicalNote: p.clinicalNote || '',
          pendingTasks: [],
          attachedFiles: [],
          date: selectedDate,
        }));

        onSaveMultiple(patientsToSave);
        addToast('success', `${extractedPatients.length} pacientes agregados`);
        onClose();
      } else {
        addToast('info', 'No se encontraron pacientes en la imagen');
      }
    } catch (error: any) {
      addToast('error', 'Error procesando lista');
    } finally {
      setIsScanningMulti(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    }
  };

  return {
    fileInputRef,
    multiFileInputRef,
    isScanning,
    isScanningMulti,
    isExtractingFromFiles,
    handleImageUpload,
    handleMultiImageUpload,
    handleExtractFromAttachments,
  };
};

export default usePatientDataExtraction;
