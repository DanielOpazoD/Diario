import { format } from 'date-fns';
import { buildClinicalNote, findReportSectionContent, formatDateDMY, REPORT_TEMPLATES } from '@domain/report';
import { sanitizeFileName } from '@shared/utils/fileNames';
import type { PatientCreateInput, PatientTypeConfig } from '@shared/types';
import type { ReportPatientField, ReportSection } from '@domain/report/entities';
import type { ReportRecord } from '@domain/report';
import { normalizeBirthDateInput } from '@shared/utils/dateUtils';

const normalizeFileToken = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getFieldValueFrom = (fields: ReportPatientField[], fieldId: string): string => (
  fields.find((field) => field.id === fieldId)?.value?.trim() || ''
);

type BuildReportPatientPayloadParams = {
  patientFields: ReportPatientField[];
  sections: ReportSection[];
  patientTypes: PatientTypeConfig[];
  selectedTypeId: string;
  now?: Date;
};

type ReportPatientPayloadResult =
  | { patientData: PatientCreateInput; typeLabel: string }
  | null;

export const buildReportPatientPayload = ({
  patientFields,
  sections,
  patientTypes,
  selectedTypeId,
  now = new Date(),
}: BuildReportPatientPayloadParams): ReportPatientPayloadResult => {
  const name = getFieldValueFrom(patientFields, 'nombre');
  const rut = getFieldValueFrom(patientFields, 'rut');
  const birthDate = normalizeBirthDateInput(getFieldValueFrom(patientFields, 'fecnac'));
  const gender = getFieldValueFrom(patientFields, 'genero') || '';

  if (!name || !rut) {
    return null;
  }

  const diagnosis = findReportSectionContent(sections, ['diagnost']);
  const clinicalNote = buildClinicalNote(sections);

  const typeConfig = patientTypes.find((type) => type.id === selectedTypeId) || patientTypes[0];
  const typeLabel = typeConfig?.label || 'Policlinico';

  const patientData: PatientCreateInput = {
    name,
    rut,
    birthDate,
    gender,
    date: format(now, 'yyyy-MM-dd'),
    type: typeLabel,
    typeId: typeConfig?.id || selectedTypeId,
    diagnosis,
    clinicalNote,
    entryTime: '',
    exitTime: '',
    pendingTasks: [],
    attachedFiles: [],
    driveFolderId: null,
  };

  return { patientData, typeLabel };
};

type BuildReportFileNameBaseParams = {
  documentType: string;
  reportDateRaw?: string;
  patientName?: string;
  now?: Date;
};

export const buildReportFileNameBase = ({
  documentType,
  reportDateRaw,
  patientName,
  now = new Date(),
}: BuildReportFileNameBaseParams): string => {
  const safePatientName = normalizeFileToken((patientName || 'paciente').trim());
  const safeDocumentType = normalizeFileToken(documentType || 'informe_clinico');
  const reportFileDate = reportDateRaw ? formatDateDMY(reportDateRaw) : format(now, 'dd-MM-yyyy');
  return sanitizeFileName(`${safeDocumentType}-${reportFileDate}-${safePatientName}`) || 'informe_clinico';
};

type ReportHeaderContext = {
  reportPatientName: string;
  reportPatientRut: string;
  reportDateRaw: string;
  reportDateDisplay: string;
  reportDocumentType: string;
};

type ReportHeaderRecord = Pick<ReportRecord, 'patientFields' | 'templateId' | 'title'>;

export const getReportHeaderContext = (record: ReportHeaderRecord): ReportHeaderContext => {
  const reportPatientName = getFieldValueFrom(record.patientFields, 'nombre') || 'Paciente sin nombre';
  const reportPatientRut = getFieldValueFrom(record.patientFields, 'rut') || 'Sin RUT';
  const reportDateRaw = getFieldValueFrom(record.patientFields, 'finf');
  const reportDateDisplay = reportDateRaw ? formatDateDMY(reportDateRaw) : 'Sin fecha';
  const reportDocumentType = REPORT_TEMPLATES[record.templateId]?.name || record.title || 'informe_clinico';

  return {
    reportPatientName,
    reportPatientRut,
    reportDateRaw,
    reportDateDisplay,
    reportDocumentType,
  };
};

type BuildReportFileNameBaseFromRecordParams = {
  record: ReportHeaderRecord;
  patientNameOverride?: string;
  now?: Date;
};

export const buildReportFileNameBaseFromRecord = ({
  record,
  patientNameOverride,
  now,
}: BuildReportFileNameBaseFromRecordParams): string => {
  const metadata = getReportHeaderContext(record);
  const rawPatientName = getFieldValueFrom(record.patientFields, 'nombre');

  return buildReportFileNameBase({
    documentType: metadata.reportDocumentType,
    reportDateRaw: metadata.reportDateRaw,
    patientName: (patientNameOverride || rawPatientName || 'paciente').trim(),
    now,
  });
};

export const getReportFieldValue = (patientFields: ReportPatientField[], fieldId: string): string => (
  getFieldValueFrom(patientFields, fieldId)
);
