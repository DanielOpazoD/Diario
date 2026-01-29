import {
  analyzeClinicalNote,
  askAboutImages,
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
  extractMultiplePatientsFromImage,
  askAboutImages,
  generateClinicalSummary,
  searchPatientsSemantically,
};
