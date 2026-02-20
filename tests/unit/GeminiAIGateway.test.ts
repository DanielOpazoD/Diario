import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAIGateway } from '../../src/services/ai/GeminiAIGateway';
import * as geminiService from '../../src/services/geminiService';
import { AIAnalysisResult, ExtractedPatientData, FileContent, GeminiStatus } from '../../src/shared/types';

vi.mock('../../src/services/geminiService', () => ({
    validateEnvironment: vi.fn(),
    analyzeClinicalNote: vi.fn(),
    generateClinicalSummary: vi.fn(),
    extractPatientDataFromImage: vi.fn(),
    extractMultiplePatientsFromImage: vi.fn(),
    extractPatientDataFromText: vi.fn(),
    askAboutImages: vi.fn(),
    searchPatientsSemantically: vi.fn(),
    extractLaboratoryResults: vi.fn(),
}));

describe('GeminiAIGateway', () => {
    let gateway: GeminiAIGateway;

    beforeEach(() => {
        vi.clearAllMocks();
        gateway = new GeminiAIGateway();
    });

    it('validateEnvironment delegates to geminiService', async () => {
        const mockStatus: GeminiStatus = { status: 'ok', length: 1, keyPreview: 'abc' };
        vi.mocked(geminiService.validateEnvironment).mockResolvedValue(mockStatus);

        const result = await gateway.validateEnvironment();

        expect(geminiService.validateEnvironment).toHaveBeenCalled();
        expect(result).toEqual(mockStatus);
    });

    it('analyzeClinicalNote delegates to geminiService', async () => {
        const mockResult: AIAnalysisResult = { structuredDiagnosis: 'Dia', extractedTasks: ['Task 1'] };
        vi.mocked(geminiService.analyzeClinicalNote).mockResolvedValue(mockResult);

        const result = await gateway.analyzeClinicalNote('Note');

        expect(geminiService.analyzeClinicalNote).toHaveBeenCalledWith('Note');
        expect(result).toEqual(mockResult);
    });

    it('generateClinicalSummary delegates to geminiService', async () => {
        vi.mocked(geminiService.generateClinicalSummary).mockResolvedValue('Summary');

        const result = await gateway.generateClinicalSummary('John', ['Note 1']);

        expect(geminiService.generateClinicalSummary).toHaveBeenCalledWith('John', ['Note 1']);
        expect(result).toBe('Summary');
    });

    it('extractPatientDataFromImage delegates to geminiService', async () => {
        const mockData: ExtractedPatientData = { name: 'John', rut: '123', birthDate: '2000', gender: 'M' };
        vi.mocked(geminiService.extractPatientDataFromImage).mockResolvedValue(mockData);

        const result = await gateway.extractPatientDataFromImage('base64', 'image/jpeg');

        expect(geminiService.extractPatientDataFromImage).toHaveBeenCalledWith('base64', 'image/jpeg');
        expect(result).toEqual(mockData);
    });

    it('extractMultiplePatientsFromImage delegates to geminiService', async () => {
        const mockData: ExtractedPatientData[] = [{ name: 'John', rut: '123', birthDate: '2000', gender: 'M' }];
        vi.mocked(geminiService.extractMultiplePatientsFromImage).mockResolvedValue(mockData);

        const result = await gateway.extractMultiplePatientsFromImage('base64', 'image/jpeg');

        expect(geminiService.extractMultiplePatientsFromImage).toHaveBeenCalledWith('base64', 'image/jpeg');
        expect(result).toEqual(mockData);
    });

    it('extractPatientDataFromText delegates to geminiService', async () => {
        const mockData: ExtractedPatientData = { name: 'John', rut: '123', birthDate: '2000', gender: 'M' };
        vi.mocked(geminiService.extractPatientDataFromText).mockResolvedValue(mockData);

        const result = await gateway.extractPatientDataFromText('raw text');

        expect(geminiService.extractPatientDataFromText).toHaveBeenCalledWith('raw text');
        expect(result).toEqual(mockData);
    });

    it('askAboutImages delegates to geminiService', async () => {
        const images: FileContent[] = [{ inlineData: { mimeType: 'image/jpeg', data: 'b64' } }];
        vi.mocked(geminiService.askAboutImages).mockResolvedValue('Answer');

        const result = await gateway.askAboutImages('Prompt', images);

        expect(geminiService.askAboutImages).toHaveBeenCalledWith('Prompt', images);
        expect(result).toBe('Answer');
    });

    it('searchPatientsSemantically delegates to geminiService', async () => {
        const patientData = [{ id: '1', context: 'Data' }];
        vi.mocked(geminiService.searchPatientsSemantically).mockResolvedValue(['1']);

        const result = await gateway.searchPatientsSemantically('query', patientData);

        expect(geminiService.searchPatientsSemantically).toHaveBeenCalledWith('query', patientData);
        expect(result).toEqual(['1']);
    });

    it('extractLaboratoryResults delegates to geminiService', async () => {
        const params = { base64Image: 'b64', mimeType: 'image/jpeg' };
        vi.mocked(geminiService.extractLaboratoryResults).mockResolvedValue('Lab results');

        const result = await gateway.extractLaboratoryResults(params);

        expect(geminiService.extractLaboratoryResults).toHaveBeenCalledWith(params);
        expect(result).toBe('Lab results');
    });
});
