/**
 * Zod Validation Helpers
 * Provides safe parsing functions for data entry points
 */

import { PatientRecordSchema, PendingTaskSchema, AttachedFileSchema } from '@shared/schemas';
import { PatientRecord, PendingTask, AttachedFile } from '@shared/types';
import type { ZodIssue, ZodType } from 'zod';

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: string[];
}

/**
 * Validates a patient record with detailed error messages
 */
export const validatePatientRecord = (data: unknown): ValidationResult<PatientRecord> => {
    const result = PatientRecordSchema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
    );

    return { success: false, errors };
};

/**
 * Validates an array of patient records (for bulk imports)
 */
export const validatePatientRecords = (data: unknown[]): ValidationResult<PatientRecord[]> => {
    const validRecords: PatientRecord[] = [];
    const allErrors: string[] = [];

    data.forEach((record, index) => {
        const result = validatePatientRecord(record);
        if (result.success && result.data) {
            validRecords.push(result.data);
        } else if (result.errors) {
            allErrors.push(`[Record ${index}]: ${result.errors.join(', ')}`);
        }
    });

    if (allErrors.length > 0) {
        return { success: false, errors: allErrors };
    }

    return { success: true, data: validRecords };
};

/**
 * Validates a pending task
 */
export const validatePendingTask = (data: unknown): ValidationResult<PendingTask> => {
    const result = PendingTaskSchema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
    );

    return { success: false, errors };
};

/**
 * Validates an attached file
 */
export const validateAttachedFile = (data: unknown): ValidationResult<AttachedFile> => {
    const result = AttachedFileSchema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
    );

    return { success: false, errors };
};

/**
 * Safe parse wrapper that logs validation errors
 */
export const safeParseWithLogging = <T>(
    schema: Pick<ZodType<T>, 'safeParse'>,
    data: unknown,
    context: string,
    onError?: (context: string, errors: ZodIssue[] | undefined) => void
): T | null => {
    const result = schema.safeParse(data);

    if (result.success) {
        return result.data;
    }

    if (onError) {
        onError(context, result.error.issues);
    }
    return null;
};
