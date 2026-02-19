import type { ReportPatientField, ReportSection, ReportTemplate } from './entities';
import { buildInstitutionTitle } from './institutionConfig';

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = Object.freeze({
  '1': { id: '1', name: buildInstitutionTitle('Informe médico de traslado'), title: buildInstitutionTitle('Informe médico de traslado') },
  '2': { id: '2', name: buildInstitutionTitle('Evolución médica (FECHA)'), title: buildInstitutionTitle('Evolución médica (____)') },
  '3': { id: '3', name: 'Epicrisis médica', title: 'Epicrisis médica' },
  '4': { id: '4', name: 'Epicrisis médica de traslado', title: 'Epicrisis médica de traslado' },
  '5': { id: '5', name: 'Otro (personalizado)', title: '' },
  '6': { id: '6', name: buildInstitutionTitle('Informe médico'), title: buildInstitutionTitle('Informe médico') },
});

export const DEFAULT_REPORT_PATIENT_FIELDS: ReportPatientField[] = [
  { id: 'nombre', label: 'Nombre', value: '', type: 'text', placeholder: 'Nombre Apellido' },
  { id: 'rut', label: 'Rut', value: '', type: 'text' },
  { id: 'edad', label: 'Edad', value: '', type: 'text', placeholder: 'años', readonly: true },
  { id: 'fecnac', label: 'Fecha de nacimiento', value: '', type: 'date' },
  { id: 'fing', label: 'Fecha de ingreso', value: '', type: 'date' },
  { id: 'finf', label: 'Fecha del informe', value: '', type: 'date' },
  { id: 'hinf', label: 'Hora del informe', value: '', type: 'time' },
];

export const DEFAULT_REPORT_SECTIONS: ReportSection[] = [
  { title: 'Antecedentes', content: '' },
  { title: 'Historia y evolución clínica', content: '' },
  { title: 'Exámenes complementarios', content: '' },
  { title: 'Diagnósticos', content: '' },
  { title: 'Plan', content: '' },
];

export const DEFAULT_REPORT_TEMPLATE_ID = '2';
