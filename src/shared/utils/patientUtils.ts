export const formatTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const normalizeNameOrder = (raw: string) => {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  const [beforeComma, afterComma] = cleaned.split(',').map(part => part.trim());

  if (afterComma && beforeComma) {
    return `${afterComma} ${beforeComma}`;
  }

  return cleaned;
};

export const formatPatientName = (str: string) => {
  if (!str) return '';
  return formatTitleCase(normalizeNameOrder(str));
};

const normalizeComparable = (value: string) =>
  value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizePatientTypeLabel = (
  value: string | null | undefined,
  fallback = 'Policlínico',
) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return fallback;
  }

  const comparable = normalizeComparable(trimmed);
  if (comparable === 'hospitalizado') return 'Hospitalizado';
  if (comparable === 'policlinico') return 'Policlínico';
  if (comparable === 'turno') return 'Turno';
  if (comparable === 'extra') return 'Extra';
  return trimmed;
};

export const inferPatientTypeId = (
  label: string | null | undefined,
  fallback = 'policlinico',
) => {
  const comparable = normalizeComparable(typeof label === 'string' ? label : '');
  if (comparable === 'hospitalizado') return 'hospitalizado';
  if (comparable === 'policlinico') return 'policlinico';
  if (comparable === 'turno') return 'turno';
  if (comparable === 'extra') return 'extra';
  return fallback;
};
