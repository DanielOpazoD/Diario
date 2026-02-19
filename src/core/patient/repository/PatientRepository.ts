import { PatientRecord, PatientCreateInput, PatientUpdateInput } from '@shared/types';
import { PatientRecordSchema, PatientCreateSchema, PatientUpdateSchema } from '@shared/schemas';
import { buildNewPatient, buildUpdatedPatient } from '@domain/patient/builders';
import { ZodIssue } from 'zod';

export class PatientRepository {
    private static formatIssues(issues: ZodIssue[]): string {
        return issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    }

    /**
     * Validates and normalizes raw patient data using Zod.
     * This ensures that any data entering the system is correctly formatted
     * (e.g., Title Case names, clean RUTs, default values).
     */
    static validate(data: unknown): { success: true; data: PatientRecord } | { success: false; error: string } {
        const result = PatientRecordSchema.safeParse(data);
        if (!result.success) {
            return {
                success: false,
                error: this.formatIssues(result.error.issues)
            };
        }
        return { success: true, data: result.data as PatientRecord };
    }

    /**
     * Prepares a new patient record from input data.
     */
    static create(input: PatientCreateInput): { success: true; data: PatientRecord } | { success: false; error: string } {
        const validation = PatientCreateSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: this.formatIssues(validation.error.issues)
            };
        }

        const patient = buildNewPatient(validation.data as PatientCreateInput);
        return { success: true, data: patient };
    }

    /**
     * Prepares an updated patient record from input data.
     */
    static update(existing: PatientRecord, input: PatientUpdateInput): { success: true; data: PatientRecord } | { success: false; error: string } {
        const validation = PatientUpdateSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: this.formatIssues(validation.error.issues)
            };
        }

        const patient = buildUpdatedPatient(existing, validation.data as PatientUpdateInput);
        return { success: true, data: patient };
    }
}
