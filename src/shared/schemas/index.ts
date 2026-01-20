
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
    id: z.string().uuid("ID de paciente inválido"),
    name: z.string().min(1, "El nombre del paciente es obligatorio"),
    rut: z.string(), // We can add RUT validation regex here later
    driveFolderId: z.string().nullable().optional(),
    birthDate: z.string().optional(), // YYYY-MM-DD
    gender: z.string().optional(),
    date: z.string(), // ISO String YYYY-MM-DD
    type: z.string(),
    typeId: z.string().optional(),
    entryTime: z.string().optional(), // HH:mm
    exitTime: z.string().optional(), // HH:mm
    diagnosis: z.string(),
    clinicalNote: z.string(),
    pendingTasks: z.array(PendingTaskSchema),
    attachedFiles: z.array(AttachedFileSchema),
    createdAt: z.number(),
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
