import { describe, expect, it } from 'vitest';
import { findReportSectionContent, formatDateDMY } from '@domain/report/utils';

describe('report utils', () => {
  it('formats ISO date to DMY', () => {
    expect(formatDateDMY('2026-02-08')).toBe('08-02-2026');
    expect(formatDateDMY('08-02-2026')).toBe('08-02-2026');
    expect(formatDateDMY('')).toBe('');
  });

  it('finds section content by keyword', () => {
    const sections = [
      { title: 'Antecedentes relevantes', content: 'Hipertension' },
      { title: 'Plan terapéutico', content: 'Control en 48h' },
    ];

    expect(findReportSectionContent(sections, ['plan'])).toBe('Control en 48h');
    expect(findReportSectionContent(sections, ['examen'])).toBe('');
  });
});
