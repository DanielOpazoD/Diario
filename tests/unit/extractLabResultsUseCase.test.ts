import { describe, expect, it, vi, beforeEach } from 'vitest';
import { extractLabResultsUseCase } from '@use-cases/patient/extractLabResultsUseCase';
import * as aiUseCases from '@use-cases/ai';
import * as attachmentUseCases from '@use-cases/attachments';

vi.mock('@use-cases/ai', () => ({
    extractLaboratoryResults: vi.fn(),
}));

vi.mock('@use-cases/attachments', () => ({
    encodeFileToBase64: vi.fn(),
    extractTextFromPdfFile: vi.fn(),
}));

vi.mock('@use-cases/logger', () => ({
    logEvent: vi.fn(),
}));

describe('extractLabResultsUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('extracts results from an image file', async () => {
        const mockFile = new File([''], 'test.png', { type: 'image/png' });
        vi.mocked(attachmentUseCases.encodeFileToBase64).mockResolvedValue('base64data');
        vi.mocked(aiUseCases.extractLaboratoryResults).mockResolvedValue('Resultados: HTO 45%');

        const result = await extractLabResultsUseCase(mockFile);

        expect(result).toBe('Resultados: HTO 45%');
        expect(attachmentUseCases.encodeFileToBase64).toHaveBeenCalledWith(mockFile);
        expect(aiUseCases.extractLaboratoryResults).toHaveBeenCalledWith({
            extractedText: undefined,
            base64Image: 'base64data',
            mimeType: 'image/png',
        });
    });

    it('extracts results from a PDF file with text', async () => {
        const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));

        vi.mocked(attachmentUseCases.extractTextFromPdfFile).mockResolvedValue('extracted text');
        vi.mocked(attachmentUseCases.encodeFileToBase64).mockResolvedValue('base64pdf');
        vi.mocked(aiUseCases.extractLaboratoryResults).mockResolvedValue('Resultados: HTO 45%');

        const result = await extractLabResultsUseCase(mockFile);

        expect(result).toBe('Resultados: HTO 45%');
        expect(attachmentUseCases.extractTextFromPdfFile).toHaveBeenCalled();
        expect(aiUseCases.extractLaboratoryResults).toHaveBeenCalledWith({
            extractedText: 'extracted text',
            base64Image: 'base64pdf',
            mimeType: 'application/pdf',
        });
    });

    it('falls back to vision if PDF text extraction fails', async () => {
        const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        vi.mocked(attachmentUseCases.extractTextFromPdfFile).mockRejectedValue(new Error('PDF error'));
        vi.mocked(attachmentUseCases.encodeFileToBase64).mockResolvedValue('base64pdf');
        vi.mocked(aiUseCases.extractLaboratoryResults).mockResolvedValue('Resultados Vision: HTO 45%');

        const result = await extractLabResultsUseCase(mockFile);

        expect(result).toBe('Resultados Vision: HTO 45%');
        expect(aiUseCases.extractLaboratoryResults).toHaveBeenCalledWith({
            extractedText: undefined,
            base64Image: 'base64pdf',
            mimeType: 'application/pdf',
        });
    });

    it('throws error if AI extraction fails', async () => {
        const mockFile = new File([''], 'test.png', { type: 'image/png' });
        vi.mocked(aiUseCases.extractLaboratoryResults).mockRejectedValue(new Error('AI error'));

        await expect(extractLabResultsUseCase(mockFile)).rejects.toThrow('AI error');
    });
});
