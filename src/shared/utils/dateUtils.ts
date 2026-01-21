import { differenceInYears, parseISO } from 'date-fns';

/**
 * Calculates age based on a birth date string (YYYY-MM-DD)
 */
export const calculateAge = (birthDate?: string): string => {
    if (!birthDate || !birthDate.trim()) return 'N/A';

    try {
        let dateToParse = birthDate.trim();
        // Handle DD-MM-YYYY format if Gemini returns it despite prompt
        if (dateToParse.includes('-') && dateToParse.split('-')[0].length === 2) {
            const [d, m, y] = dateToParse.split('-');
            dateToParse = `${y}-${m}-${d}`;
        }

        const birth = parseISO(dateToParse);
        if (isNaN(birth.getTime())) return 'N/A';

        const age = differenceInYears(new Date(), birth);

        // Sanity check: If age is negative or > 120, something is likely wrong with the extraction
        if (age < 0 || age > 120) return 'N/A';

        return `${age} a`;
    } catch (error) {
        return 'N/A';
    }
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
