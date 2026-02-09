import { sanitizeRichText } from '@shared/utils/richTextSanitization';
import type { ReportRecord } from '@domain/report/entities';
import { findReportSectionContent } from '@domain/report/utils';

export const buildClinicalNote = (sections: ReportRecord['sections']) => {
  const antecedentes = sanitizeRichText(findReportSectionContent(sections, ['antecedente']));
  const historia = sanitizeRichText(findReportSectionContent(sections, ['historia', 'evoluci']));
  const examen = sanitizeRichText(findReportSectionContent(sections, ['examen']));
  const plan = sanitizeRichText(findReportSectionContent(sections, ['plan']));

  return [
    antecedentes ? `Antecedentes:\n${antecedentes}` : '',
    historia ? `Historia y evolución clínica:\n${historia}` : '',
    examen ? `Exámenes complementarios:\n${examen}` : '',
    plan ? `Plan:\n${plan}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
};
