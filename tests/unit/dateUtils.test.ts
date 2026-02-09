import { describe, expect, it, vi } from 'vitest';
import {
  calculateAge,
  formatBirthDateDisplay,
  formatMonthName,
  formatToDayMonth,
  formatToDisplayDate,
  getYearMonth,
  normalizeBirthDateInput,
  parseBirthDate,
} from '@shared/utils/dateUtils';

describe('dateUtils', () => {
  it('parses birth dates across formats', () => {
    expect(parseBirthDate('1985-02-10')).toEqual(new Date(1985, 1, 10));
    expect(parseBirthDate('10-02-1985')).toEqual(new Date(1985, 1, 10));
    expect(parseBirthDate('10/02/1985')).toEqual(new Date(1985, 1, 10));
    expect(parseBirthDate('invalid')).toBeNull();
    expect(parseBirthDate('')).toBeNull();
  });

  it('formats birth date display and normalizes inputs', () => {
    expect(formatBirthDateDisplay('1985-02-10')).toBe('10-02-1985');
    expect(formatBirthDateDisplay('10-02-1985')).toBe('10-02-1985');
    expect(formatBirthDateDisplay('')).toBe('');
    expect(formatBirthDateDisplay('invalid-date')).toBe('invalid-date');
    expect(normalizeBirthDateInput('1985-02-10')).toBe('10-02-1985');
    expect(normalizeBirthDateInput('1/2/85')).toBe('01-02-1985');
    expect(normalizeBirthDateInput('1-2-25')).toBe('01-02-2025');
    expect(normalizeBirthDateInput('1-2-75')).toBe('01-02-1975');
    expect(normalizeBirthDateInput('')).toBe('');
  });

  it('calculates age and guards invalid values', () => {
    const now = new Date('2026-01-31T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(calculateAge('2000-01-01')).toBe('26 a');
    expect(calculateAge('3000-01-01')).toBe('N/A');
    expect(calculateAge('')).toBe('N/A');

    vi.useRealTimers();
  });

  it('formats month names and display dates', () => {
    expect(getYearMonth('2026-01-31')).toEqual({ year: '2026', month: '01' });
    expect(formatMonthName('03')).toBe('Marzo');
    expect(formatMonthName('13')).toBe('13');
    expect(formatToDisplayDate('2026-01-31')).toBe('31-01-2026');
    expect(formatToDisplayDate('2026/01/31')).toBe('2026/01/31');
    expect(formatToDisplayDate('')).toBe('');
    expect(formatToDayMonth('2026-01-31')).toBe('31-01');
    expect(formatToDayMonth('2026/01/31')).toBe('2026/01/31');
    expect(formatToDayMonth('')).toBe('');
  });
});
