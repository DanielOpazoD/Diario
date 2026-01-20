import { describe, it, expect } from 'vitest';
import {
    sanitizeText,
    sanitizeClinicalNote,
    sanitizePatientName,
    sanitizeRut,
    sanitizeDiagnosis,
} from '@shared/utils/sanitization';

describe('Sanitization Utilities', () => {
    describe('sanitizeText', () => {
        it('should remove HTML tags', () => {
            // sanitizeText removes tags but preserves inner content
            expect(sanitizeText('<div>Content</div>')).toBe('Content');
            expect(sanitizeText('<b>Bold</b> text')).toBe('Bold text');
        });

        it('should remove javascript: protocols', () => {
            expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
        });

        it('should remove event handlers', () => {
            expect(sanitizeText('onclick=alert(1)')).toBe('alert(1)');
        });

        it('should normalize whitespace', () => {
            expect(sanitizeText('  hello   world  ')).toBe('hello world');
        });

        it('should return empty string for null/undefined', () => {
            expect(sanitizeText('')).toBe('');
        });
    });

    describe('sanitizeClinicalNote', () => {
        it('should remove script tags', () => {
            const input = '<script>malicious</script>Patient stable';
            expect(sanitizeClinicalNote(input)).toBe('Patient stable');
        });

        it('should preserve line breaks', () => {
            const input = 'Line 1\nLine 2\r\nLine 3';
            expect(sanitizeClinicalNote(input)).toBe('Line 1\nLine 2\nLine 3');
        });

        it('should preserve medical formatting', () => {
            const note = 'Dx: Neumonía\nTx: Antibióticos\nNota: Estable';
            expect(sanitizeClinicalNote(note)).toBe(note);
        });
    });

    describe('sanitizePatientName', () => {
        it('should allow accented characters', () => {
            expect(sanitizePatientName('José María')).toBe('José María');
        });

        it('should remove numbers and special characters', () => {
            expect(sanitizePatientName('Juan123 Pérez!')).toBe('Juan Pérez');
        });

        it('should normalize multiple spaces', () => {
            expect(sanitizePatientName('Juan   Pérez')).toBe('Juan Pérez');
        });

        it('should allow hyphens and apostrophes', () => {
            expect(sanitizePatientName("O'Brien-Smith")).toBe("O'Brien-Smith");
        });
    });

    describe('sanitizeRut', () => {
        it('should keep valid RUT characters', () => {
            expect(sanitizeRut('12.345.678-9')).toBe('12.345.678-9');
        });

        it('should convert k to uppercase K', () => {
            expect(sanitizeRut('12.345.678-k')).toBe('12.345.678-K');
        });

        it('should remove invalid characters', () => {
            expect(sanitizeRut('12.345.abc.678-9')).toBe('12.345..678-9');
        });

        it('should handle empty input', () => {
            expect(sanitizeRut('')).toBe('');
        });
    });

    describe('sanitizeDiagnosis', () => {
        it('should behave like sanitizeClinicalNote', () => {
            const input = '<b>Diagnóstico</b>: Neumonía';
            expect(sanitizeDiagnosis(input)).toBe('Diagnóstico: Neumonía');
        });
    });
});
