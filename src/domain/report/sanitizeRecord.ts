import { sanitizeText } from '@shared/utils/sanitization';
import { sanitizeRichText } from '@shared/utils/richTextSanitization';
import {
  DEFAULT_REPORT_PATIENT_FIELDS,
  DEFAULT_REPORT_SECTIONS,
  DEFAULT_REPORT_TEMPLATE_ID,
  REPORT_TEMPLATES,
} from '@domain/report/rules';
import type { ReportPatientField, ReportRecord, ReportSection } from '@domain/report/entities';

export const sanitizeReportRecord = (record: ReportRecord): ReportRecord => {
  const templateId = REPORT_TEMPLATES[record.templateId] ? record.templateId : DEFAULT_REPORT_TEMPLATE_ID;
  const templateTitle = REPORT_TEMPLATES[templateId]?.title || 'Registro clínico';
  const safeSections = Array.isArray(record.sections) && record.sections.length
    ? record.sections
    : JSON.parse(JSON.stringify(DEFAULT_REPORT_SECTIONS));
  const safeFields = Array.isArray(record.patientFields) && record.patientFields.length
    ? record.patientFields
    : JSON.parse(JSON.stringify(DEFAULT_REPORT_PATIENT_FIELDS));

  return {
    version: record.version || '1.0.0',
    templateId,
    title: sanitizeText(record.title || templateTitle),
    patientFields: safeFields.map((field: ReportPatientField) => ({
      ...field,
      label: sanitizeText(field.label || ''),
      value: sanitizeText(field.value || ''),
    })),
    sections: safeSections.map((section: ReportSection) => ({
      ...section,
      title: sanitizeText(section.title || ''),
      content: sanitizeRichText(section.content || ''),
    })),
    medico: sanitizeText(record.medico || ''),
    especialidad: sanitizeText(record.especialidad || ''),
  };
};
