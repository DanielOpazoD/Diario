import { describe, expect, it } from 'vitest';
import {
  buildReportFileNameBase,
  buildReportFileNameBaseFromRecord,
  buildReportPatientPayload,
  getReportHeaderContext,
} from '@use-cases/reportPatient';

describe('reportPatient use-cases', () => {
  const patientTypes = [
    { id: 'hospitalizado', label: 'Hospitalizado', colorClass: 'text-red-500' },
    { id: 'policlinico', label: 'Policlínico', colorClass: 'text-blue-500' },
  ];

  it('returns null when mandatory patient fields are missing', () => {
    const result = buildReportPatientPayload({
      patientFields: [
        { id: 'nombre', label: 'Nombre', value: '', type: 'text' },
        { id: 'rut', label: 'RUT', value: '', type: 'text' },
      ],
      sections: [],
      patientTypes,
      selectedTypeId: 'policlinico',
      now: new Date('2026-02-18T12:00:00Z'),
    });

    expect(result).toBeNull();
  });

  it('builds patient payload from report fields and sections', () => {
    const result = buildReportPatientPayload({
      patientFields: [
        { id: 'nombre', label: 'Nombre', value: 'Daniel Opazo', type: 'text' },
        { id: 'rut', label: 'RUT', value: '17.752.753-K', type: 'text' },
        { id: 'fecnac', label: 'Fecha de nacimiento', value: '1987-04-03', type: 'date' },
      ],
      sections: [
        { title: 'Diagnósticos', content: 'Insuficiencia cardiaca' },
        { title: 'Plan', content: 'Control en 48 horas' },
      ],
      patientTypes,
      selectedTypeId: 'hospitalizado',
      now: new Date('2026-02-18T12:00:00Z'),
    });

    expect(result).not.toBeNull();
    expect(result?.patientData.name).toBe('Daniel Opazo');
    expect(result?.patientData.rut).toBe('17.752.753-K');
    expect(result?.patientData.birthDate).toBe('03-04-1987');
    expect(result?.patientData.typeId).toBe('hospitalizado');
    expect(result?.patientData.type).toBe('Hospitalizado');
    expect(result?.patientData.date).toBe('2026-02-18');
    expect(result?.patientData.diagnosis).toBe('Insuficiencia cardiaca');
    expect(result?.patientData.clinicalNote).toContain('Plan:');
  });

  it('builds stable report filename base from document/date/patient', () => {
    const result = buildReportFileNameBase({
      documentType: 'Evolución médica (FECHA)',
      reportDateRaw: '2026-02-17',
      patientName: 'José Pérez',
    });

    expect(result).toBe('evolucion_medica_fecha-17-02-2026-jose_perez');
  });

  it('extracts header context from report record', () => {
    const metadata = getReportHeaderContext({
      templateId: '2',
      title: 'Evolución médica (17-02-2026)',
      patientFields: [
        { id: 'nombre', label: 'Nombre', value: 'Daniel Opazo', type: 'text' },
        { id: 'rut', label: 'RUT', value: '17.752.753-K', type: 'text' },
        { id: 'finf', label: 'Fecha informe', value: '2026-02-17', type: 'date' },
      ],
    });

    expect(metadata.reportPatientName).toBe('Daniel Opazo');
    expect(metadata.reportPatientRut).toBe('17.752.753-K');
    expect(metadata.reportDateRaw).toBe('2026-02-17');
    expect(metadata.reportDateDisplay).toBe('17-02-2026');
    expect(metadata.reportDocumentType).toBe('Evolución médica (FECHA) - Hospital Hanga Roa');
  });

  it('builds default report filename base directly from report record', () => {
    const result = buildReportFileNameBaseFromRecord({
      record: {
        templateId: '2',
        title: 'Evolución médica (17-02-2026)',
        patientFields: [
          { id: 'nombre', label: 'Nombre', value: 'María López', type: 'text' },
          { id: 'rut', label: 'RUT', value: '10.111.222-3', type: 'text' },
          { id: 'finf', label: 'Fecha informe', value: '2026-02-17', type: 'date' },
        ],
      },
    });

    expect(result).toBe('evolucion_medica_fecha_-_hospital_hanga_roa-17-02-2026-maria_lopez');
  });
});
