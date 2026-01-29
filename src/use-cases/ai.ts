import { geminiAdapter } from '@data/adapters/geminiAdapter';

export const validateEnvironment = geminiAdapter.validateEnvironment;
export const analyzeClinicalNote = geminiAdapter.analyzeClinicalNote;
export const extractPatientDataFromImage = geminiAdapter.extractPatientDataFromImage;
export const extractMultiplePatientsFromImage = geminiAdapter.extractMultiplePatientsFromImage;
export const askAboutImages = geminiAdapter.askAboutImages;
export const generateClinicalSummary = geminiAdapter.generateClinicalSummary;
export const searchPatientsSemantically = geminiAdapter.searchPatientsSemantically;

export type { FileContent } from '@services/geminiService';
