import { describe, expect, it, vi } from 'vitest';
import { generateHandoverReport } from '@services/reportService';

const mockDoc = {
  internal: { pageSize: { width: 210, height: 297 } },
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setLineWidth: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  addPage: vi.fn(),
  setFont: vi.fn(),
  splitTextToSize: vi.fn().mockReturnValue(['line1', 'line2']),
  getNumberOfPages: vi.fn().mockReturnValue(1),
  setPage: vi.fn(),
  save: vi.fn(),
};

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(function () {
    return mockDoc;
  }),
}));

describe('reportService', () => {
  it('renders empty report', () => {
    generateHandoverReport([], new Date('2026-01-31T00:00:00Z'), 'Dr. Test');
    expect(mockDoc.text).toHaveBeenCalledWith(
      'No hay pacientes registrados para esta fecha.',
      20,
      expect.any(Number),
    );
    expect(mockDoc.save).toHaveBeenCalled();
  });

  it('renders patient data with notes and tasks', () => {
    mockDoc.text.mockClear();
    mockDoc.save.mockClear();
    generateHandoverReport(
      [
        {
          name: 'Paciente',
          rut: '12.345.678-5',
          type: 'Hospitalizado',
          diagnosis: 'Dx',
          clinicalNote: 'Nota larga',
          pendingTasks: [{ text: 'Tarea', isCompleted: false }],
        } as any,
      ],
      new Date('2026-01-31T00:00:00Z'),
      'Dr. Test',
    );
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Paciente'), 20, expect.any(Number));
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Pendientes:'), 25, expect.any(Number));
    expect(mockDoc.save).toHaveBeenCalled();
  });
});
