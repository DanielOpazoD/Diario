import React, { useRef, useState } from 'react';
import { extractMultiplePatientsFromImage, extractPatientDataFromImage, extractPatientDataFromText } from '@use-cases/ai';
import { fileToBase64, downloadUrlAsBase64, downloadUrlAsArrayBuffer } from '@services/storage';
import { extractTextFromPdf } from '@services/pdfText';
import { extractPatientDataFromText as extractPatientDataFromTextLocal, normalizeExtractedPatientData } from '@core/patient/utils/patientTextExtraction';
import { AttachedFile, PatientCreateInput, PatientType } from '@shared/types';
import { formatPatientName } from '@core/patient/utils/patientUtils';

interface UsePatientDataExtractionParams {
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  selectedDate: string;
  onClose: () => void;
  onSaveMultiple?: (patients: PatientCreateInput[]) => void;
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

  const applyExtractedData = (extractedData: any) => {
    if (!extractedData) return;
    const normalized = normalizeExtractedPatientData(extractedData);
    if (normalized.name) setName(formatPatientName(normalized.name));
    if (normalized.rut) setRut(normalized.rut);
    if (normalized.birthDate) setBirthDate(normalized.birthDate);
    if (normalized.gender) setGender(normalized.gender);
    if (normalized.diagnosis) setDiagnosis(normalized.diagnosis);
    if (normalized.clinicalNote) setClinicalNote(normalized.clinicalNote);
  };

  const mergeExtracted = (base: any, incoming: any) => ({
    ...base,
    name: base.name || incoming?.name || '',
    rut: base.rut || incoming?.rut || '',
    birthDate: base.birthDate || incoming?.birthDate || '',
    gender: base.gender || incoming?.gender || '',
    diagnosis: base.diagnosis || incoming?.diagnosis || '',
    clinicalNote: base.clinicalNote || incoming?.clinicalNote || '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      if (file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer();
        const text = await extractTextFromPdf(buffer);
        const localExtracted = extractPatientDataFromTextLocal(text);
        let finalExtracted = localExtracted;

        const isMissingCore =
          !localExtracted.name || !localExtracted.rut || !localExtracted.birthDate || !localExtracted.gender;

        if (isMissingCore) {
          try {
            const aiExtracted = await extractPatientDataFromText(text);
            finalExtracted = mergeExtracted(localExtracted, normalizeExtractedPatientData(aiExtracted || {}));
          } catch (error) {
            addToast('info', 'IA no disponible. Usando solo extracción local del PDF.');
          }
        }

        applyExtractedData(finalExtracted);
        addToast('success', 'Datos extraídos desde PDF');
      } else {
        const base64 = await fileToBase64(file);
        const extractedData = await extractPatientDataFromImage(base64, file.type);
        if (extractedData) {
          applyExtractedData(extractedData);
          addToast('success', 'Datos extraídos');
        }
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
          let extractedData: any = null;

          if (file.mimeType === 'application/pdf') {
            const buffer = await downloadUrlAsArrayBuffer(file.driveUrl);
            const text = await extractTextFromPdf(buffer);
            const localExtracted = extractPatientDataFromTextLocal(text);
            const isMissingCore =
              !localExtracted.name || !localExtracted.rut || !localExtracted.birthDate || !localExtracted.gender;
            let aiExtracted: any = null;
            if (isMissingCore) {
              try {
                aiExtracted = await extractPatientDataFromText(text);
              } catch (error) {
                addToast('info', 'IA no disponible. Usando solo extracción local del PDF.');
              }
            }
            extractedData = mergeExtracted(localExtracted, normalizeExtractedPatientData(aiExtracted || {}));
          } else {
            const base64 = await downloadUrlAsBase64(file.driveUrl);
            extractedData = await extractPatientDataFromImage(base64, file.mimeType);
          }

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
