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
        // Remove HTML/script tags
        .replace(/<[^>]*>/g, '')
        // Remove javascript: protocols
        .replace(/javascript:/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=/gi, '')
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
        // Remove HTML/script tags but preserve newlines
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        // Remove javascript: protocols
        .replace(/javascript:/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=/gi, '')
        // Preserve line breaks (important for clinical notes)
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
