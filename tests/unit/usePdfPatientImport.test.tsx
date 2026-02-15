import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePdfPatientImport } from '@core/patient/hooks/usePdfPatientImport';

vi.mock('@use-cases/patient/extraction', () => ({
  extractPatientDataFromImageAI: vi.fn(),
  extractPatientDataFromTextAI: vi.fn(),
  extractPatientDataFromTextLocalUseCase: vi.fn(),
  normalizeExtractedPatientDataUseCase: (data: any) => data,
  mergeExtractedFieldsUseCase: (base: Record<string, unknown>, incoming: Record<string, unknown>) => ({
    ...base,
    ...incoming,
  }),
  extractAndNormalizePatientText: vi.fn(),
  extractMultiplePatientsFromImageAI: vi.fn(),
}));

vi.mock('@use-cases/attachments', () => ({
  encodeFileToBase64: vi.fn(),
  extractTextFromPdfFile: vi.fn(),
  uploadPatientFile: vi.fn(),
}));

vi.mock('@use-cases/logger', () => ({
  logEvent: vi.fn(),
}));

const mockAddToast = vi.fn();
const mockAddPatient = vi.fn();
const mockUpdatePatient = vi.fn();

vi.mock('@core/stores/useAppStore', () => ({
  default: (selector: (state: {
    addToast: typeof mockAddToast;
    addPatient: typeof mockAddPatient;
    updatePatient: typeof mockUpdatePatient;
  }) => unknown) =>
    selector({
      addToast: mockAddToast,
      addPatient: mockAddPatient,
      updatePatient: mockUpdatePatient,
    }),
}));

describe('usePdfPatientImport', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows error when no PDF files selected', async () => {
    const { result } = renderHook(() => usePdfPatientImport(new Date('2024-01-02')));
    const file = new File([new Uint8Array([1])], 'img.png', { type: 'image/png' });

    await act(async () => {
      await result.current.handlePdfUpload({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockAddToast).toHaveBeenCalledWith('error', 'Por favor selecciona archivos PDF');
  });

  it('imports patient from local PDF extraction', async () => {
    const { extractTextFromPdfFile, uploadPatientFile } = await import('@use-cases/attachments');
    const { extractAndNormalizePatientText } = await import('@use-cases/patient/extraction');

    (extractTextFromPdfFile as any).mockResolvedValue('texto');
    (extractAndNormalizePatientText as any).mockReturnValue({
      name: 'Paciente Uno',
      rut: '1-9',
      birthDate: '2000-01-01',
      gender: 'F',
      diagnosis: 'Dx',
      clinicalNote: 'Nota',
    });
    (uploadPatientFile as any).mockResolvedValue({ id: 'f1', name: 'doc.pdf' });

    const { result } = renderHook(() => usePdfPatientImport(new Date('2024-01-02')));
    const file = {
      name: 'doc.pdf',
      type: 'application/pdf',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    await act(async () => {
      await result.current.handlePdfUpload({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockAddPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('Paciente'),
        rut: '1-9',
      })
    );
    expect(mockUpdatePatient).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('Importados 1 pacientes')
    );
  });

  it('falls back to AI extraction when core data missing', async () => {
    const { extractTextFromPdfFile, uploadPatientFile } = await import('@use-cases/attachments');
    const {
      extractAndNormalizePatientText,
      extractPatientDataFromTextAI,
    } = await import('@use-cases/patient/extraction');

    (extractTextFromPdfFile as any).mockResolvedValue('texto');
    (extractAndNormalizePatientText as any).mockReturnValue({
      name: '',
      rut: '',
      birthDate: '',
      gender: '',
    });
    (extractPatientDataFromTextAI as any).mockResolvedValue({
      name: 'AI Paciente',
      rut: '2-7',
      birthDate: '1999-12-01',
      gender: 'M',
    });
    (uploadPatientFile as any).mockResolvedValue({ id: 'f2', name: 'doc.pdf' });

    const { result } = renderHook(() => usePdfPatientImport(new Date('2024-01-02')));
    const file = {
      name: 'doc.pdf',
      type: 'application/pdf',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    await act(async () => {
      await result.current.handlePdfUpload({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockAddPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        rut: '2-7',
      })
    );
    expect(mockAddToast).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('Importados 1 pacientes')
    );
  });

  it('handles validation failure when data missing', async () => {
    const { extractTextFromPdfFile } = await import('@use-cases/attachments');
    const {
      extractAndNormalizePatientText,
      extractPatientDataFromTextAI,
    } = await import('@use-cases/patient/extraction');

    (extractTextFromPdfFile as any).mockResolvedValue('texto');
    (extractAndNormalizePatientText as any).mockReturnValue({
      name: '',
      rut: '',
    });
    (extractPatientDataFromTextAI as any).mockRejectedValue(new Error('no-ai'));

    const { result } = renderHook(() => usePdfPatientImport(new Date('2024-01-02')));
    const file = {
      name: 'doc.pdf',
      type: 'application/pdf',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    await act(async () => {
      await result.current.handlePdfUpload({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('No se pudieron extraer datos válidos')
    );
  });

  it('falls back to direct AI PDF extraction when text extraction has no core fields', async () => {
    const { extractTextFromPdfFile, uploadPatientFile, encodeFileToBase64 } = await import('@use-cases/attachments');
    const {
      extractAndNormalizePatientText,
      extractPatientDataFromTextAI,
      extractPatientDataFromImageAI,
    } = await import('@use-cases/patient/extraction');

    (extractTextFromPdfFile as any).mockResolvedValue('');
    (extractAndNormalizePatientText as any).mockReturnValue({});
    (extractPatientDataFromTextAI as any).mockResolvedValue(null);
    (encodeFileToBase64 as any).mockResolvedValue('base64-pdf');
    (extractPatientDataFromImageAI as any).mockResolvedValue({
      name: 'Paciente Vision',
      rut: '12.345.678-5',
      birthDate: '2001-02-03',
      gender: 'Femenino',
      diagnosis: 'Dx vision',
      clinicalNote: 'Nota vision',
    });
    (uploadPatientFile as any).mockResolvedValue({ id: 'f3', name: 'doc.pdf' });

    const { result } = renderHook(() => usePdfPatientImport(new Date('2024-01-02')));
    const file = {
      name: 'doc.pdf',
      type: 'application/pdf',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    await act(async () => {
      await result.current.handlePdfUpload({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(extractPatientDataFromImageAI).toHaveBeenCalledWith('base64-pdf', 'application/pdf');
    expect(mockAddPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('Paciente'),
      })
    );
  });
});
