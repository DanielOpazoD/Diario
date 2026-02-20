import { AIGateway } from '@core/ai/AIGateway';
import * as gemini from '@services/geminiService';
import { AIAnalysisResult, ExtractedPatientData, FileContent, GeminiStatus } from '@shared/types';

export class GeminiAIGateway implements AIGateway {
    validateEnvironment(): Promise<GeminiStatus> {
        return gemini.validateEnvironment();
    }

    async analyzeClinicalNote(noteText: string): Promise<AIAnalysisResult> {
        return gemini.analyzeClinicalNote(noteText);
    }

    async generateClinicalSummary(patientName: string, notes: string[]): Promise<string> {
        return gemini.generateClinicalSummary(patientName, notes);
    }

    async extractPatientDataFromImage(base64Image: string, mimeType: string): Promise<ExtractedPatientData | null> {
        return gemini.extractPatientDataFromImage(base64Image, mimeType);
    }

    async extractMultiplePatientsFromImage(base64Image: string, mimeType: string): Promise<ExtractedPatientData[]> {
        return gemini.extractMultiplePatientsFromImage(base64Image, mimeType);
    }

    async extractPatientDataFromText(extractedText: string): Promise<ExtractedPatientData | null> {
        return gemini.extractPatientDataFromText(extractedText);
    }

    async askAboutImages(prompt: string, images: FileContent[]): Promise<string> {
        return gemini.askAboutImages(prompt, images);
    }

    async searchPatientsSemantically(query: string, patientData: { id: string, context: string }[]): Promise<string[]> {
        return gemini.searchPatientsSemantically(query, patientData);
    }

    async extractLaboratoryResults(params: {
        base64Image?: string;
        mimeType?: string;
        extractedText?: string;
    }): Promise<string> {
        return gemini.extractLaboratoryResults(params);
    }
}

export const aiGateway: AIGateway = new GeminiAIGateway();
