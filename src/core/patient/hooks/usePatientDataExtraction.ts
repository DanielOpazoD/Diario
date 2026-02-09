import React, { useCallback, useRef, useState } from 'react';
import {
  extractMultiplePatientsFromImageAI,
  extractPatientDataFromImageAI,
  extractPatientDataFromTextAI,
  normalizeExtractedPatientDataUseCase,
  extractAndNormalizePatientText,
  mergeExtractedFieldsUseCase,
  isMissingCoreExtractedFieldsUseCase,
} from '@use-cases/patient/extraction';
import { filterSupportedAttachments, hasDriveUrl } from '@use-cases/patient/attachmentsSupport';
import { diffExtractedFields } from '@use-cases/patient/fieldUpdates';
import { logEvent } from '@use-cases/logger';
import { encodeFileToBase64, fetchUrlAsBase64, fetchUrlAsArrayBuffer, extractTextFromPdfFile } from '@use-cases/attachments';
import { AttachedFile, PatientCreateInput, PatientType } from '@shared/types';
import { sanitizePatientName } from '@use-cases/patient/sanitizeFields';

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

  const applyExtractedData = useCallback((extractedData: any) => {
    if (!extractedData) return;
    const normalized = normalizeExtractedPatientDataUseCase(extractedData);
    if (normalized.name) setName(sanitizePatientName(normalized.name));
    if (normalized.rut) setRut(normalized.rut);
    if (normalized.birthDate) setBirthDate(normalized.birthDate);
    if (normalized.gender) setGender(normalized.gender);
    if (normalized.diagnosis) setDiagnosis(normalized.diagnosis);
    if (normalized.clinicalNote) setClinicalNote(normalized.clinicalNote);
  }, [setBirthDate, setClinicalNote, setDiagnosis, setGender, setName, setRut]);

  const mergeExtracted = useCallback(mergeExtractedFieldsUseCase, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      if (file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer();
        const text = await extractTextFromPdfFile(buffer);
        const localExtracted = extractAndNormalizePatientText(text);
        let finalExtracted = localExtracted;

        const isMissingCore = isMissingCoreExtractedFieldsUseCase(localExtracted);

        if (isMissingCore) {
          try {
            const aiExtracted = await extractPatientDataFromTextAI(text);
            finalExtracted = mergeExtracted(localExtracted, normalizeExtractedPatientDataUseCase(aiExtracted || {}));
          } catch (error) {
            addToast('info', 'IA no disponible. Usando solo extracción local del PDF.');
          }
        }

        applyExtractedData(finalExtracted);
        addToast('success', 'Datos extraídos desde PDF');
      } else {
        const base64 = await encodeFileToBase64(file);
        const extractedData = await extractPatientDataFromImageAI(base64, file.type);
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
  }, [addToast, applyExtractedData, mergeExtracted]);

  const handleExtractFromAttachments = useCallback(async (
    attachedFiles: AttachedFile[],
    currentFields: { name: string; rut: string; birthDate: string; gender: string; diagnosis: string; clinicalNote: string },
  ) => {
    if (!attachedFiles.length) {
      return addToast('info', 'Primero agrega adjuntos del paciente.');
    }

    const supportedFiles = filterSupportedAttachments(attachedFiles);
    if (!supportedFiles.length) {
      return addToast('info', 'Los adjuntos actuales no son compatibles (solo imágenes o PDF).');
    }



    setIsExtractingFromFiles(true);

    try {
      const updatedFields = new Set<string>();

      for (const file of supportedFiles) {
        try {
          if (!hasDriveUrl(file)) continue;
          let extractedData: any = null;

          if (file.mimeType === 'application/pdf') {
            const buffer = await fetchUrlAsArrayBuffer(file.driveUrl);
            const text = await extractTextFromPdfFile(buffer);
            const localExtracted = extractAndNormalizePatientText(text);
            const isMissingCore = isMissingCoreExtractedFieldsUseCase(localExtracted);
            let aiExtracted: any = null;
            if (isMissingCore) {
              try {
                aiExtracted = await extractPatientDataFromTextAI(text);
              } catch (error) {
                addToast('info', 'IA no disponible. Usando solo extracción local del PDF.');
              }
            }
            extractedData = mergeExtracted(localExtracted, normalizeExtractedPatientDataUseCase(aiExtracted || {}));
          } else {
            const base64 = await fetchUrlAsBase64(file.driveUrl);
            extractedData = await extractPatientDataFromImageAI(base64, file.mimeType);
          }

          if (extractedData) {
            const { updates, labels } = diffExtractedFields(currentFields, extractedData);
            if (updates.name) setName(sanitizePatientName(updates.name));
            if (updates.rut) setRut(updates.rut);
            if (updates.birthDate) setBirthDate(updates.birthDate);
            if (updates.gender) setGender(updates.gender);
            if (updates.diagnosis) setDiagnosis(updates.diagnosis);
            if (updates.clinicalNote) setClinicalNote(updates.clinicalNote);
            labels.forEach(label => updatedFields.add(label));
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
          logEvent('error', 'AI', 'Extraction failed', {
            fileName: file.name,
            error,
          });
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
  }, [addToast, mergeExtracted, setBirthDate, setClinicalNote, setDiagnosis, setGender, setName, setRut]);

  const handleMultiImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onSaveMultiple) {
      addToast('error', 'Función no disponible en este contexto');
      return;
    }

    setIsScanningMulti(true);
    try {
      const base64 = await encodeFileToBase64(file);
      const extractedPatients = await extractMultiplePatientsFromImageAI(base64, file.type);

      if (extractedPatients && extractedPatients.length > 0) {
        const patientsToSave = extractedPatients.map(p => ({
          name: sanitizePatientName(p.name),
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
  }, [addToast, onClose, onSaveMultiple, selectedDate]);

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
