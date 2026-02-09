import { differenceInYears, format, isValid, parseISO } from 'date-fns';

export const formatLocalYMD = (date?: Date, fallback: Date = new Date()): string => {
    const base = date instanceof Date && isValid(date) ? date : fallback;
    return format(base, 'yyyy-MM-dd');
};

export const parseBirthDate = (birthDate?: string): Date | null => {
    if (!birthDate || !birthDate.trim()) return null;
    const value = birthDate.trim();

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const dmyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmyMatch) {
        const [, day, month, year] = dmyMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const dmySlashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmySlashMatch) {
        const [, day, month, year] = dmySlashMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatBirthDateDisplay = (birthDate?: string): string => {
    if (!birthDate || !birthDate.trim()) return '';
    const parsed = parseBirthDate(birthDate);
    if (!parsed) return birthDate;
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
};

export { normalizeBirthDate as normalizeBirthDateInput } from '@domain/patient/dates';

/**
 * Calculates age based on a birth date string (YYYY-MM-DD)
 */
export const calculateAge = (birthDate?: string): string => {
    const parsed = parseBirthDate(birthDate);
    if (!parsed) return 'N/A';
    const age = differenceInYears(new Date(), parsed);
    if (age < 0 || age > 120) return 'N/A';
    return `${age} a`;
};

/**
 * Gets year and month from an ISO date string
 */
export const getYearMonth = (dateStr: string) => {
    const date = parseISO(dateStr);
    return {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString().padStart(2, '0')
    };
};

/**
 * Format month number to Spanish name
 */
export const formatMonthName = (month: string): string => {
    const months: Record<string, string> = {
        '01': 'Enero',
        '02': 'Febrero',
        '03': 'Marzo',
        '04': 'Abril',
        '05': 'Mayo',
        '06': 'Junio',
        '07': 'Julio',
        '08': 'Agosto',
        '09': 'Septiembre',
        '10': 'Octubre',
        '11': 'Noviembre',
        '12': 'Diciembre',
    };
    return months[month] || month;
};
/**
 * Formats an ISO date string (YYYY-MM-DD) to Display format (DD-MM-YYYY)
 */
export const formatToDisplayDate = (dateStr?: string): string => {
    if (!dateStr || !dateStr.includes('-')) return dateStr || '';
    try {
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    } catch (error) {
        return dateStr;
    }
};

/**
 * Formats an ISO date string (YYYY-MM-DD) to Short Display (DD-MM)
 */
export const formatToDayMonth = (dateStr?: string): string => {
    if (!dateStr || !dateStr.includes('-')) return dateStr || '';
    try {
        const [_, month, day] = dateStr.split('-');
        return `${day}-${month}`;
    } catch (error) {
        return dateStr;
    }
};
