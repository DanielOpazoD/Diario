import { AIAnalysisResult, ExtractedPatientData, FileContent } from '@shared/types';

export interface AIPort {
  validateEnvironment: () => Promise<{ status: string; length: number; keyPreview: string }>;
  analyzeClinicalNote: (noteText: string) => Promise<AIAnalysisResult>;
  extractPatientDataFromImage: (
    base64Image: string,
    mimeType: string
  ) => Promise<ExtractedPatientData | null>;
  extractPatientDataFromText: (extractedText: string) => Promise<ExtractedPatientData | null>;
  extractMultiplePatientsFromImage: (
    base64Image: string,
    mimeType: string
  ) => Promise<ExtractedPatientData[]>;
  askAboutImages: (prompt: string, images: FileContent[]) => Promise<string>;
  generateClinicalSummary: (patientName: string, notes: string[]) => Promise<string>;
  searchPatientsSemantically: (
    query: string,
    patientData: { id: string; context: string }[]
  ) => Promise<string[]>;
}
