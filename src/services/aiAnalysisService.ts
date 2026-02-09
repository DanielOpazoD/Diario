/**
 * AI Analysis Service
 * Centralizes all AI-powered analysis functionality
 */

import { z } from 'zod';
import { analyzeClinicalNote, generateClinicalSummary } from '@services/geminiService';
import { emitStructuredLog } from '@services/logger';
import { PendingTask } from '@shared/types';

// Schema for AI analysis response
const AIAnalysisResultSchema = z.object({
    structuredDiagnosis: z.string(),
    extractedTasks: z.array(z.string()),
});

export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>;

export interface AnalysisContext {
    patientName?: string;
    clinicalNote: string;
}

export interface AnalysisCallbacks {
    onDiagnosisExtracted: (diagnosis: string) => void;
    onTasksExtracted: (tasks: PendingTask[]) => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

/**
 * Analyzes a clinical note using AI and extracts structured data
 */
export const analyzeNote = async (
    context: AnalysisContext,
    callbacks: AnalysisCallbacks
): Promise<boolean> => {
    if (!context.clinicalNote.trim()) {
        callbacks.onError('Escribe una nota primero');
        return false;
    }

    try {
        const result = await analyzeClinicalNote(context.clinicalNote);

        // Validate AI response with Zod
        const validation = AIAnalysisResultSchema.safeParse(result);
        if (!validation.success) {
            emitStructuredLog('error', 'AI', 'Validation failed', { error: validation.error });
            throw new Error('La respuesta de la IA no tiene el formato correcto.');
        }

        // Process diagnosis
        if (result.structuredDiagnosis) {
            callbacks.onDiagnosisExtracted(result.structuredDiagnosis);
        }

        // Process tasks
        const newTasks: PendingTask[] = result.extractedTasks.map((text) => ({
            id: crypto.randomUUID(),
            text,
            isCompleted: false,
        }));

        if (newTasks.length > 0) {
            callbacks.onTasksExtracted(newTasks);
        }

        callbacks.onSuccess('Análisis IA completado');
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        callbacks.onError(`Error AI: ${message}`);
        return false;
    }
};

/**
 * Generates a clinical summary using AI
 */
export const generateSummary = async (
    patientName: string,
    notes: string[],
    callbacks: Pick<AnalysisCallbacks, 'onError' | 'onSuccess'>
): Promise<string | null> => {
    if (notes.length === 0 || !notes[0].trim()) {
        callbacks.onError('No hay notas para resumir');
        return null;
    }

    try {
        const summary = await generateClinicalSummary(patientName, notes);
        callbacks.onSuccess('Resumen generado');
        return summary;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        callbacks.onError(`Error Summary: ${message}`);
        return null;
    }
};

/**
 * Batch analyze multiple notes
 */
export const batchAnalyzeNotes = async (
    notes: AnalysisContext[],
    callbacks: Pick<AnalysisCallbacks, 'onError' | 'onSuccess'>
): Promise<AIAnalysisResult[]> => {
    const results: AIAnalysisResult[] = [];

    for (const note of notes) {
        try {
            const result = await analyzeClinicalNote(note.clinicalNote);
            const validation = AIAnalysisResultSchema.safeParse(result);

            if (validation.success) {
                results.push(validation.data);
            }
        } catch (error) {
            emitStructuredLog('error', 'AI', 'Batch analysis error', { error });
        }
    }

    callbacks.onSuccess(`Análisis completado: ${results.length}/${notes.length} notas`);
    return results;
};
