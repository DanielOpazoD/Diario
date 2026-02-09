export const normalizeBirthDate = (value?: string): string => {
  if (!value) return '';
  const raw = value.trim();

  const isoMatch = raw.match(/\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  const dmyMatch = raw.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (dmyMatch) {
    const [, day, month, yearRaw] = dmyMatch;
    let year = yearRaw;
    if (year.length === 2) {
      const yearNum = Number(year);
      year = yearNum < 30 ? `20${year}` : `19${year}`;
    }
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  return '';
};
