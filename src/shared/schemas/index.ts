
import { z } from 'zod';

// Basic Types
export const PatientTypeEnum = z.enum(['Hospitalizado', 'Policlínico', 'Extra', 'Turno']);

// Config Interface
export const PatientTypeConfigSchema = z.object({
    id: z.string(),
    label: z.string(),
    colorClass: z.string(),
    isDefault: z.boolean().optional(),
});

// Tasks
export const PendingTaskSchema = z.object({
    id: z.string(),
    text: z.string().min(1, "El texto de la tarea es obligatorio"),
    isCompleted: z.boolean(),
    createdAt: z.number().optional(),
    completedAt: z.number().optional(),
    completionNote: z.string().optional(),
});

export const GeneralTaskSchema = z.object({
    id: z.string(),
    text: z.string().min(1, "El texto de la tarea es obligatorio"),
    isCompleted: z.boolean(),
    createdAt: z.number(),
    priority: z.enum(['low', 'medium', 'high']),
});

// Files
export const AttachedFileSchema = z.object({
    id: z.string(),
    name: z.string(),
    mimeType: z.string(),
    size: z.number(),
    uploadedAt: z.number(),
    driveUrl: z.string().url("URL de Drive inválida"),
    thumbnailLink: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    category: z.enum(['lab', 'imaging', 'report', 'prescription', 'other']).optional(),
    isStarred: z.boolean().optional(),
});

// Patient Record (The Core Entity)
export const PatientRecordSchema = z.object({
    id: z.string(),
    name: z.string().nullable().catch('').transform(v => v ?? ''),
    rut: z.string().nullable().catch('').transform(v => v ?? ''),
    driveFolderId: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    gender: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    date: z.string().catch(() => new Date().toISOString().split('T')[0]),
    type: z.string().catch('Hospitalizado'),
    typeId: z.string().optional().catch('policlinico').transform(v => v ?? 'policlinico'),
    entryTime: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    exitTime: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    diagnosis: z.string().nullable().catch('').transform(v => v ?? ''),
    clinicalNote: z.string().nullable().catch('').transform(v => v ?? ''),
    pendingTasks: z.array(z.any()).nullish().transform(val => {
        if (!val || !Array.isArray(val)) return [];
        return val.map(t => ({
            id: t?.id || crypto.randomUUID(),
            text: t?.text || '',
            isCompleted: !!t?.isCompleted,
            createdAt: t?.createdAt,
            completedAt: t?.completedAt,
            completionNote: t?.completionNote,
        }));
    }),
    attachedFiles: z.array(z.any()).nullish().transform(val => {
        if (!val || !Array.isArray(val)) return [];
        return val;
    }),
    updatedAt: z.number().optional().catch(() => Date.now()),
    createdAt: z.number().optional().default(() => Date.now()).catch(() => Date.now()),
});

// User & Settings
export const UserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url(),
});

export const SecuritySettingsSchema = z.object({
    pin: z.string().nullable(),
    autoLockMinutes: z.number().min(1).max(60),
});

// Inferred Types (to replace manual interfaces eventually)
export type PatientRecord = z.infer<typeof PatientRecordSchema>;
export type PendingTask = z.infer<typeof PendingTaskSchema>;
export type AttachedFile = z.infer<typeof AttachedFileSchema>;
export type User = z.infer<typeof UserSchema>;
