import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReportHeaderViewModel } from '@features/reports/hooks/useReportHeaderViewModel';
import type { ReportRecord } from '@domain/report';

const buildRecord = (): ReportRecord => ({
  version: '1',
  templateId: '2',
  title: 'Evolución médica (____)',
  patientFields: [
    { id: 'nombre', label: 'Nombre', value: 'Daniel Opazo', type: 'text' },
    { id: 'rut', label: 'RUT', value: '17.752.753-K', type: 'text' },
    { id: 'finf', label: 'Fecha informe', value: '2026-02-17', type: 'date' },
  ],
  sections: [],
  medico: '',
  especialidad: '',
});

describe('useReportHeaderViewModel', () => {
  it('returns report header metadata and filename builder', () => {
    const { result } = renderHook(() => useReportHeaderViewModel(buildRecord()));

    expect(result.current.reportPatientName).toBe('Daniel Opazo');
    expect(result.current.reportPatientRut).toBe('17.752.753-K');
    expect(result.current.reportDateDisplay).toBe('17-02-2026');
    expect(result.current.buildDefaultReportFileNameBase()).toBe(
      'evolucion_medica_fecha_-_hospital_hanga_roa-17-02-2026-daniel_opazo'
    );
  });
});
