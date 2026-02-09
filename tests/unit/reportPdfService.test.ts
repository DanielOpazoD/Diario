import { describe, expect, it, vi, beforeEach } from 'vitest';
import { generateReportPdfBlob } from '@features/reports/services/reportPdfService';
import type { ReportRecord } from '@domain/report/entities';

const mockDoc = {
  internal: { pageSize: { getWidth: vi.fn(() => 216), getHeight: vi.fn(() => 279) } },
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  splitTextToSize: vi.fn((value: string) => [value]),
  getTextWidth: vi.fn((value: string) => value.length * 2),
  addPage: vi.fn(),
  addImage: vi.fn(),
  output: vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' })),
};

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function () { return mockDoc; }),
  jsPDF: vi.fn().mockImplementation(function () { return mockDoc; }),
}));

const buildRecord = (): ReportRecord => ({
  version: '1',
  templateId: '1',
  title: 'Informe clínico',
  patientFields: [
    { id: 'nombre', label: 'Nombre', value: 'Paciente Demo', type: 'text' },
    { id: 'rut', label: 'RUT', value: '1-9', type: 'text' },
  ],
  sections: [
    { title: 'Diagnóstico', content: '<p>Paciente estable.</p>' },
  ],
  medico: 'Dra. Demo',
  especialidad: 'Medicina Interna',
});

describe('reportPdfService', () => {
  beforeEach(() => {
    Object.values(mockDoc).forEach((value) => {
      if (typeof value === 'function' && 'mockClear' in value) {
        (value as { mockClear: () => void }).mockClear();
      }
    });
    Object.values(mockDoc.internal.pageSize).forEach((value) => {
      if (typeof value === 'function' && 'mockClear' in value) {
        (value as { mockClear: () => void }).mockClear();
      }
    });
  });

  it('returns a pdf blob without image rendering', async () => {
    const result = await generateReportPdfBlob(buildRecord());

    expect(result).toBeInstanceOf(Blob);
    expect(mockDoc.output).toHaveBeenCalledWith('blob');
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it('includes main sections as text blocks', async () => {
    await generateReportPdfBlob(buildRecord());

    const renderedTexts = mockDoc.text.mock.calls.map((call) => String(call[0]));

    expect(renderedTexts).toEqual(expect.arrayContaining([
      'Informe clínico',
      'Información del Paciente',
      'Diagnóstico',
      'Profesional Responsable',
    ]));
  });
});
