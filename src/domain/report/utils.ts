import type { ReportRecord } from '@domain/report/entities';

const normalizeText = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const formatDateDMY = (value?: string) => {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
};

export const findReportSectionContent = (sections: ReportRecord['sections'], keywords: string[]) => {
  const normalized = keywords.map((keyword) => normalizeText(keyword));
  const match = sections.find((section) =>
    normalized.some((keyword) => normalizeText(section.title).includes(keyword))
  );
  return match?.content?.trim() || '';
};
