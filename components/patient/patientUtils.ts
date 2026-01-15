export const formatTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const normalizeNameOrder = (raw: string) => {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  const [beforeComma, afterComma] = cleaned.split(',').map(part => part.trim());

  if (afterComma && beforeComma) {
    return `${afterComma} ${beforeComma}`;
  }

  return cleaned;
};

export const formatPatientName = (str: string) => formatTitleCase(normalizeNameOrder(str));
