import { describe, expect, it } from 'vitest';
import type { ReportRecord } from '@domain/report/entities';
import {
  buildClinicalReportJsonPayload,
  parseClinicalReportJsonPayload,
  stringifyClinicalReportJsonPayload,
  CLINICAL_REPORT_JSON_KIND,
  CLINICAL_REPORT_JSON_SCHEMA_VERSION,
} from '@features/reports/services/reportJsonService';

const createRecord = (): ReportRecord => ({
  version: '1.0.0',
  templateId: '2',
  title: 'Evolución médica (31-01-2026)',
  patientFields: [
    { id: 'nombre', label: 'Nombre', value: 'Paciente Test', type: 'text' },
    { id: 'rut', label: 'RUT', value: '11.111.111-1', type: 'text' },
  ],
  sections: [
    { title: 'Diagnóstico', content: '<p>Paciente estable</p>' },
  ],
  medico: 'Médico Test',
  especialidad: 'Medicina',
});

describe('reportJsonService', () => {
  it('builds wrapped payload with schema metadata', () => {
    const payload = buildClinicalReportJsonPayload({
      report: createRecord(),
      patient: { id: 'p-1', name: 'Paciente Test', rut: '11.111.111-1', date: '2026-01-31' },
      createdAt: 1700000000000,
    });

    expect(payload.kind).toBe(CLINICAL_REPORT_JSON_KIND);
    expect(payload.schemaVersion).toBe(CLINICAL_REPORT_JSON_SCHEMA_VERSION);
    expect(payload.createdAt).toBe(1700000000000);
    expect(payload.patientSnapshot).toEqual({
      id: 'p-1',
      name: 'Paciente Test',
      rut: '11.111.111-1',
      date: '2026-01-31',
    });
    expect(payload.report.title).toContain('Evolución médica');
  });

  it('parses wrapped JSON payload', () => {
    const raw = stringifyClinicalReportJsonPayload({
      report: createRecord(),
      patient: { id: 'p-2', name: 'Paciente 2', rut: '22.222.222-2', date: '2026-02-01' },
      createdAt: 1700000000001,
    });

    const parsed = parseClinicalReportJsonPayload(raw);

    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe('wrapped');
    expect(parsed?.payload.patientSnapshot.name).toBe('Paciente 2');
    expect(parsed?.payload.report.sections[0]?.title).toBe('Diagnóstico');
  });

  it('parses legacy report JSON and wraps it', () => {
    const rawLegacy = JSON.stringify(createRecord());
    const parsed = parseClinicalReportJsonPayload(rawLegacy);

    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe('wrapped');
    expect(parsed?.payload.kind).toBe(CLINICAL_REPORT_JSON_KIND);
    expect(parsed?.payload.report.templateId).toBe('2');
  });

  it('parses nested payloads with record key', () => {
    const rawNested = JSON.stringify({
      createdAt: 1700000000999,
      payload: {
        record: createRecord(),
      },
    });
    const parsed = parseClinicalReportJsonPayload(rawNested);

    expect(parsed).not.toBeNull();
    expect(parsed?.payload.report.title).toContain('Evolución médica');
    expect(parsed?.payload.createdAt).toBe(1700000000999);
  });

  it('returns null for invalid JSON payloads', () => {
    expect(parseClinicalReportJsonPayload('not-json')).toBeNull();
    expect(parseClinicalReportJsonPayload(JSON.stringify({ foo: 'bar' }))).toBeNull();
  });
});
