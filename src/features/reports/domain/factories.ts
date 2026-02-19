import {
  DEFAULT_REPORT_PATIENT_FIELDS,
  DEFAULT_REPORT_SECTIONS,
  DEFAULT_REPORT_TEMPLATE_ID,
  REPORT_TEMPLATES,
} from '@features/reports/domain/rules';
import type { ReportRecord } from '@features/reports/domain/entities';

export const createTemplateBaseline = (templateId: string): ReportRecord => {
  const selectedTemplateId = REPORT_TEMPLATES[templateId] ? templateId : DEFAULT_REPORT_TEMPLATE_ID;
  const template = REPORT_TEMPLATES[selectedTemplateId];

  return {
    version: '1.0.0',
    templateId: selectedTemplateId,
    title: template?.title || 'Registro clínico',
    patientFields: JSON.parse(JSON.stringify(DEFAULT_REPORT_PATIENT_FIELDS)),
    sections: JSON.parse(JSON.stringify(DEFAULT_REPORT_SECTIONS)),
    medico: '',
    especialidad: '',
  };
};
