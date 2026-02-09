import { describe, expect, it } from 'vitest';
import { formatPatientName, formatTitleCase } from '@core/patient/utils/patientUtils';

describe('patientUtils', () => {
  it('formats title case and handles empty input', () => {
    expect(formatTitleCase('')).toBe('');
    expect(formatTitleCase('maria LOPEZ')).toBe('Maria Lopez');
  });

  it('formats patient name and normalizes comma order', () => {
    expect(formatPatientName('Perez, Juan')).toBe('Juan Perez');
    expect(formatPatientName('  ana   gomez ')).toBe('Ana Gomez');
  });
});
