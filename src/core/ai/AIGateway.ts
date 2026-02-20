import { AIAnalysisResult, ExtractedPatientData, FileContent, GeminiStatus } from '@shared/types';

export interface AIGateway {
    analyzeClinicalNote(noteText: string): Promise<AIAnalysisResult>;
    generateClinicalSummary(patientName: string, notes: string[]): Promise<string>;
    extractPatientDataFromImage(base64Image: string, mimeType: string): Promise<ExtractedPatientData | null>;
    extractMultiplePatientsFromImage(base64Image: string, mimeType: string): Promise<ExtractedPatientData[]>;
    extractPatientDataFromText(extractedText: string): Promise<ExtractedPatientData | null>;
    askAboutImages(prompt: string, images: FileContent[]): Promise<string>;
    searchPatientsSemantically(query: string, patientData: { id: string, context: string }[]): Promise<string[]>;
    validateEnvironment(): Promise<GeminiStatus>;
    extractLaboratoryResults(params: {
        base64Image?: string;
        mimeType?: string;
        extractedText?: string;
    }): Promise<string>;
}
