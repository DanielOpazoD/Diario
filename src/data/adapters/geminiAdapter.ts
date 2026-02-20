import { aiGateway } from '@services/ai/GeminiAIGateway';
import type { AIPort } from '@data/ports/aiPort';

export const geminiAdapter: AIPort = {
  validateEnvironment: () => aiGateway.validateEnvironment(),
  analyzeClinicalNote: (text) => aiGateway.analyzeClinicalNote(text),
  extractPatientDataFromImage: (image, mime) => aiGateway.extractPatientDataFromImage(image, mime),
  extractPatientDataFromText: (text) => aiGateway.extractPatientDataFromText(text),
  extractMultiplePatientsFromImage: (image, mime) => aiGateway.extractMultiplePatientsFromImage(image, mime),
  askAboutImages: (prompt, images) => aiGateway.askAboutImages(prompt, images),
  generateClinicalSummary: (name, notes) => aiGateway.generateClinicalSummary(name, notes),
  searchPatientsSemantically: (query, data) => aiGateway.searchPatientsSemantically(query, data),
  extractLaboratoryResults: (params) => aiGateway.extractLaboratoryResults(params),
};
