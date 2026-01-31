export interface ReportPatientField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'date' | 'number' | 'time';
  placeholder?: string;
  readonly?: boolean;
  isCustom?: boolean;
}

export type ReportSectionKind = 'standard' | 'clinical-update';

export interface ReportSection {
  title: string;
  content: string;
  kind?: ReportSectionKind;
  updateDate?: string;
  updateTime?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  title: string;
}

export interface ReportRecord {
  version: string;
  templateId: string;
  title: string;
  patientFields: ReportPatientField[];
  sections: ReportSection[];
  medico: string;
  especialidad: string;
}
