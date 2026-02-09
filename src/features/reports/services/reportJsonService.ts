import type { PatientRecord } from '@shared/types';
import type { ReportRecord } from '@domain/report/entities';
import { sanitizeReportRecord } from '@domain/report/sanitizeRecord';

export const CLINICAL_REPORT_JSON_KIND = 'clinical-report';
export const CLINICAL_REPORT_JSON_SCHEMA_VERSION = '1.0.0';

export interface ClinicalReportJsonFileV1 {
  kind: typeof CLINICAL_REPORT_JSON_KIND;
  schemaVersion: typeof CLINICAL_REPORT_JSON_SCHEMA_VERSION;
  createdAt: number;
  patientSnapshot: {
    id?: string;
    name: string;
    rut: string;
    date: string;
  };
  report: ReportRecord;
}

export interface BuildClinicalReportJsonInput {
  report: ReportRecord;
  patient?: (Pick<PatientRecord, 'name' | 'rut' | 'date'> & { id?: string }) | null;
  createdAt?: number;
}

export type ParsedClinicalReportJson =
  | { source: 'wrapped'; payload: ClinicalReportJsonFileV1 }
  | { source: 'legacy-report'; payload: ClinicalReportJsonFileV1 };

const isObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object'
);

const isReportRecordCandidate = (value: unknown): value is ReportRecord => {
  if (!isObject(value)) return false;
  if (!Array.isArray(value.patientFields)) return false;
  if (!Array.isArray(value.sections)) return false;
  return typeof value.templateId === 'string' && typeof value.title === 'string';
};

const findReportRecordCandidate = (root: unknown, maxDepth = 4): ReportRecord | null => {
  const visited = new Set<unknown>();
  const queue: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const { value, depth } = current;

    if (isReportRecordCandidate(value)) {
      return value;
    }
    if (!isObject(value) || depth >= maxDepth) continue;
    if (visited.has(value)) continue;
    visited.add(value);

    const keys = ['report', 'record', 'payload', 'data', ...Object.keys(value)];
    for (const key of keys) {
      const next = value[key];
      if (next !== undefined) {
        queue.push({ value: next, depth: depth + 1 });
      }
    }
  }

  return null;
};

const buildPatientSnapshot = (patient?: BuildClinicalReportJsonInput['patient']) => ({
  id: patient?.id,
  name: patient?.name || '',
  rut: patient?.rut || '',
  date: patient?.date || '',
});

export const buildClinicalReportJsonPayload = ({
  report,
  patient,
  createdAt = Date.now(),
}: BuildClinicalReportJsonInput): ClinicalReportJsonFileV1 => ({
  kind: CLINICAL_REPORT_JSON_KIND,
  schemaVersion: CLINICAL_REPORT_JSON_SCHEMA_VERSION,
  createdAt,
  patientSnapshot: buildPatientSnapshot(patient),
  report: sanitizeReportRecord(report),
});

export const stringifyClinicalReportJsonPayload = (input: BuildClinicalReportJsonInput): string => (
  JSON.stringify(buildClinicalReportJsonPayload(input), null, 2)
);

export const parseClinicalReportJsonPayload = (rawJson: string): ParsedClinicalReportJson | null => {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const reportCandidate = findReportRecordCandidate(parsed);

    if (isObject(parsed) && reportCandidate) {
      const payload: ClinicalReportJsonFileV1 = {
        kind: CLINICAL_REPORT_JSON_KIND,
        schemaVersion: CLINICAL_REPORT_JSON_SCHEMA_VERSION,
        createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
        patientSnapshot: buildPatientSnapshot(
          isObject(parsed.patientSnapshot)
            ? {
              id: typeof parsed.patientSnapshot.id === 'string' ? parsed.patientSnapshot.id : undefined,
              name: typeof parsed.patientSnapshot.name === 'string' ? parsed.patientSnapshot.name : '',
              rut: typeof parsed.patientSnapshot.rut === 'string' ? parsed.patientSnapshot.rut : '',
              date: typeof parsed.patientSnapshot.date === 'string' ? parsed.patientSnapshot.date : '',
            }
            : undefined
        ),
        report: sanitizeReportRecord(reportCandidate),
      };

      return { source: 'wrapped', payload };
    }

    if (reportCandidate) {
      return {
        source: 'legacy-report',
        payload: buildClinicalReportJsonPayload({
          report: reportCandidate,
        }),
      };
    }

    return null;
  } catch (_error) {
    return null;
  }
};
