import {
  analyzeClinicalNote,
  askAboutImages,
  extractPatientDataFromText,
  extractMultiplePatientsFromImage,
  extractPatientDataFromImage,
  generateClinicalSummary,
  searchPatientsSemantically,
  validateEnvironment,
} from '@services/geminiService';
import type { AIPort } from '@data/ports/aiPort';

export const geminiAdapter: AIPort = {
  validateEnvironment,
  analyzeClinicalNote,
  extractPatientDataFromImage,
  extractPatientDataFromText,
  extractMultiplePatientsFromImage,
  askAboutImages,
  generateClinicalSummary,
  searchPatientsSemantically,
};
