import { extractPatientDataFromText as extractPatientDataFromTextLocal } from '@domain/patient/patientTextExtraction';
import { normalizeExtractedPatientData } from '@domain/patient/patientTextExtraction';
import {
  extractPatientDataFromImage,
  extractPatientDataFromText,
  extractMultiplePatientsFromImage,
} from '@use-cases/ai';
import { mergeExtractedFields } from '@use-cases/patient/mergeExtracted';
import { isMissingCoreExtractedFields } from '@use-cases/patient/validation';

export const extractPatientDataFromTextLocalUseCase = extractPatientDataFromTextLocal;
export const extractAndNormalizePatientText = (text: string) =>
  normalizeExtractedPatientData(extractPatientDataFromTextLocal(text));
export const normalizeExtractedPatientDataUseCase = normalizeExtractedPatientData;
export const extractPatientDataFromImageAI = extractPatientDataFromImage;
export const extractPatientDataFromTextAI = extractPatientDataFromText;
export const extractMultiplePatientsFromImageAI = extractMultiplePatientsFromImage;
export const mergeExtractedFieldsUseCase = mergeExtractedFields;
export const isMissingCoreExtractedFieldsUseCase = isMissingCoreExtractedFields;
