import { extractLaboratoryResults } from '@use-cases/ai';
import { encodeFileToBase64, extractTextFromPdfFile } from '@use-cases/attachments';
import { logEvent } from '@use-cases/logger';

export const extractLabResultsUseCase = async (file: File): Promise<string> => {
    try {
        let extractedText: string | undefined;
        let base64Image: string | undefined;
        let mimeType: string | undefined;

        if (file.type === 'application/pdf') {
            try {
                const buffer = await file.arrayBuffer();
                extractedText = await extractTextFromPdfFile(buffer);
            } catch (error) {
                logEvent('info', 'AI', 'PDF text extraction failed, falling back to vision', { error });
            }

            // Always provide base64 for PDF as fallback or for better extraction if text is messy
            base64Image = await encodeFileToBase64(file);
            mimeType = file.type;
        } else {
            base64Image = await encodeFileToBase64(file);
            mimeType = file.type;
        }

        const result = await extractLaboratoryResults({
            extractedText,
            base64Image,
            mimeType,
        });

        return result;
    } catch (error) {
        logEvent('error', 'AI', 'Lab results extraction use case failed', { error });
        throw error;
    }
};
