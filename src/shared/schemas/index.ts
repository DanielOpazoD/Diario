
import { z } from 'zod';
import { inferPatientTypeId, normalizePatientTypeLabel } from '@shared/utils/patientUtils';

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

export const BookmarkCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    icon: z.string().optional(),
    color: z.string().optional(),
});

export const BookmarkSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    url: z.string().url(),
    icon: z.string().optional(),
    note: z.string().optional(),
    categoryId: z.string().optional(),
    isFavorite: z.boolean().optional(),
    createdAt: z.number(),
    order: z.number(),
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

const toObjectRecord = (value: unknown): Record<string, unknown> | null => (
    value && typeof value === 'object' ? (value as Record<string, unknown>) : null
);

const normalizePendingTask = (value: unknown, index: number) => {
    const candidate = toObjectRecord(value);
    if (!candidate) return null;

    const parsed = PendingTaskSchema.safeParse({
        id: typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : `task-${index}`,
        text: typeof candidate.text === 'string' ? candidate.text.trim() : '',
        isCompleted: Boolean(candidate.isCompleted),
        createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : undefined,
        completedAt: typeof candidate.completedAt === 'number' ? candidate.completedAt : undefined,
        completionNote: typeof candidate.completionNote === 'string' ? candidate.completionNote.trim() : undefined,
    });

    return parsed.success ? parsed.data : null;
};

const normalizeAttachedFile = (value: unknown, index: number) => {
    const candidate = toObjectRecord(value);
    if (!candidate) return null;

    const parsed = AttachedFileSchema.safeParse({
        id: typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : `file-${index}`,
        name: typeof candidate.name === 'string' ? candidate.name : '',
        mimeType: typeof candidate.mimeType === 'string' ? candidate.mimeType : 'application/octet-stream',
        size: typeof candidate.size === 'number' ? candidate.size : 0,
        uploadedAt: typeof candidate.uploadedAt === 'number' ? candidate.uploadedAt : Date.now(),
        driveUrl: typeof candidate.driveUrl === 'string' ? candidate.driveUrl : '',
        thumbnailLink: typeof candidate.thumbnailLink === 'string' ? candidate.thumbnailLink : undefined,
        tags: Array.isArray(candidate.tags) ? candidate.tags.filter((tag): tag is string => typeof tag === 'string') : undefined,
        description: typeof candidate.description === 'string' ? candidate.description : undefined,
        category: candidate.category,
        isStarred: typeof candidate.isStarred === 'boolean' ? candidate.isStarred : undefined,
    });

    return parsed.success ? parsed.data : null;
};

// Patient Record (The Core Entity)
export const PatientRecordSchema = z.object({
    id: z.string(),
    name: z.string().nullable().catch('').transform(v => v ?? ''),
    rut: z.string().nullable().catch('').transform(v => v ?? ''),
    driveFolderId: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    gender: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    date: z.string().catch(() => new Date().toISOString().split('T')[0]),
    type: z.string().catch('Hospitalizado').transform((value) => normalizePatientTypeLabel(value, 'Hospitalizado')),
    typeId: z.string().nullish().transform((value) => {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        return trimmed.length > 0 ? trimmed : undefined;
    }),
    entryTime: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    exitTime: z.string().nullable().optional().catch('').transform(v => v ?? ''),
    diagnosis: z.string().nullable().catch('').transform(v => v ?? ''),
    clinicalNote: z.string().nullable().catch('').transform(v => v ?? ''),
    pendingTasks: z.array(z.unknown()).nullish().transform(val => {
        if (!val || !Array.isArray(val)) return [];
        return val.flatMap((task, index) => {
            const normalized = normalizePendingTask(task, index);
            return normalized ? [normalized] : [];
        });
    }),
    attachedFiles: z.array(z.unknown()).nullish().transform(val => {
        if (!val || !Array.isArray(val)) return [];
        return val.flatMap((file, index) => {
            const normalized = normalizeAttachedFile(file, index);
            return normalized ? [normalized] : [];
        });
    }),
    updatedAt: z.number().optional().catch(() => Date.now()),
    createdAt: z.number().optional().default(() => Date.now()).catch(() => Date.now()),
    syncMeta: z
        .object({
            source: z.enum(['local', 'remote']).optional(),
            updatedBy: z.string().optional(),
            updatedAt: z.number().optional(),
        })
        .optional(),
}).transform((record) => ({
    ...record,
    typeId: record.typeId || inferPatientTypeId(record.type),
}));

// User & Settings
export const UserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url(),
});

export const SecuritySettingsSchema = z.object({
    pinHash: z.string().nullable(),
    pinSalt: z.string().nullable(),
    autoLockMinutes: z.number().min(1).max(60),
});

// Inferred Types (to replace manual interfaces eventually)
export type PatientRecord = z.infer<typeof PatientRecordSchema>;
export type PendingTask = z.infer<typeof PendingTaskSchema>;
export type AttachedFile = z.infer<typeof AttachedFileSchema>;
export type User = z.infer<typeof UserSchema>;
export type GeneralTask = z.infer<typeof GeneralTaskSchema>;
export type Bookmark = z.infer<typeof BookmarkSchema>;
export type BookmarkCategory = z.infer<typeof BookmarkCategorySchema>;
