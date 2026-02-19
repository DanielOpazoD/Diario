/**
 * Sanitization Utilities for Clinical Data
 * Prevents XSS and ensures clean data storage
 */

/**
 * Sanitizes plain text by removing potentially dangerous content
 */
export const sanitizeText = (input: string): string => {
    if (!input) return '';

    return input
        // Remove script, iframe, object, embed, style tags
        .replace(/<(script|iframe|object|embed|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
        // Remove other HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove dangerous protocols
        .replace(/(javascript|data|vbscript):/gi, '')
        // Remove ALL event handlers (on...)
        .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Sanitizes clinical notes - preserves line breaks and medical formatting
 */
export const sanitizeClinicalNote = (input: string): string => {
    if (!input) return '';

    return input
        // Remove dangerous tags but preserve content structure
        .replace(/<(script|iframe|object|embed|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
        .replace(/<[^>]*>/g, '')
        // Remove dangerous protocols
        .replace(/(javascript|data|vbscript):/gi, '')
        // Remove ALL event handlers
        .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
        // Preserve line breaks
        .replace(/\r\n/g, '\n')
        .trim();
};

/**
 * Sanitizes a patient name - normalizes casing and removes special chars
 */
export const sanitizePatientName = (input: string): string => {
    if (!input) return '';

    return input
        // Remove any non-alphabetic characters except spaces and accented chars
        .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]/g, '')
        // Normalize multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Sanitizes a RUT (Chilean ID number)
 */
export const sanitizeRut = (input: string): string => {
    if (!input) return '';

    // Keep only numbers, dots, dashes, and K
    return input
        .replace(/[^0-9.kK-]/g, '')
        .toUpperCase();
};

/**
 * Sanitizes a diagnosis field
 */
export const sanitizeDiagnosis = (input: string): string => {
    return sanitizeClinicalNote(input);
};
