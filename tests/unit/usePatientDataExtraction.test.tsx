import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePatientDataExtraction from '@core/patient/hooks/usePatientDataExtraction';
import type { AttachedFile } from '@shared/types';

const mockAddToast = vi.fn();
const mockOnClose = vi.fn();
const mockOnSaveMultiple = vi.fn();

const mockSetName = vi.fn();
const mockSetRut = vi.fn();
const mockSetBirthDate = vi.fn();
const mockSetGender = vi.fn();
const mockSetDiagnosis = vi.fn();
const mockSetClinicalNote = vi.fn();

vi.mock('@use-cases/patient/extraction', () => ({
  extractPatientDataFromImageAI: vi.fn(),
  extractPatientDataFromTextAI: vi.fn(),
  extractMultiplePatientsFromImageAI: vi.fn(),
  extractPatientDataFromTextLocalUseCase: vi.fn(),
  normalizeExtractedPatientDataUseCase: (data: any) => data,
  extractAndNormalizePatientText: vi.fn(),
  mergeExtractedFieldsUseCase: (base: any, incoming: any) => ({ ...base, ...incoming }),
  isMissingCoreExtractedFieldsUseCase: (data: any) => !data?.name || !data?.rut || !data?.birthDate || !data?.gender,
}));

vi.mock('@use-cases/attachments', () => ({
  encodeFileToBase64: vi.fn(),
  fetchUrlAsBase64: vi.fn(),
  fetchUrlAsArrayBuffer: vi.fn(),
  extractTextFromPdfFile: vi.fn(),
}));

describe('usePatientDataExtraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const buildHook = () =>
    renderHook(() =>
      usePatientDataExtraction({
        addToast: mockAddToast,
        selectedDate: '2024-01-02',
        onClose: mockOnClose,
        onSaveMultiple: mockOnSaveMultiple,
        setName: mockSetName,
        setRut: mockSetRut,
        setBirthDate: mockSetBirthDate,
        setGender: mockSetGender,
        setDiagnosis: mockSetDiagnosis,
        setClinicalNote: mockSetClinicalNote,
      })
    );

  it('warns when no files selected for extraction', async () => {
    const { result } = buildHook();
    await act(async () => {
      await result.current.handleExtractFromAttachments([], {
        name: '',
        rut: '',
        birthDate: '',
        gender: '',
        diagnosis: '',
        clinicalNote: '',
      });
    });

    expect(mockAddToast).toHaveBeenCalledWith('info', 'Primero agrega adjuntos del paciente.');
  });

  it('applies extracted fields from pdf text', async () => {
    const { extractTextFromPdfFile, fetchUrlAsArrayBuffer } = await import('@use-cases/attachments');
    const { extractAndNormalizePatientText } = await import('@use-cases/patient/extraction');

    (extractTextFromPdfFile as any).mockResolvedValue('contenido');
    (fetchUrlAsArrayBuffer as any).mockResolvedValue(new ArrayBuffer(8));
    (extractAndNormalizePatientText as any).mockReturnValue({
      name: 'Nombre',
      rut: '1-9',
      birthDate: '2000-01-01',
      gender: 'F',
      diagnosis: 'Dx',
      clinicalNote: 'Nota',
    });

    const { result } = buildHook();
    const file: AttachedFile = {
      id: 'f1',
      name: 'doc.pdf',
      mimeType: 'application/pdf',
      driveUrl: 'http://example.com/doc.pdf',
      size: 100,
      uploadedAt: Date.now(),
    };

    await act(async () => {
      await result.current.handleExtractFromAttachments([file], {
        name: '',
        rut: '',
        birthDate: '',
        gender: '',
        diagnosis: '',
        clinicalNote: '',
      });
    });

    expect(mockSetName).toHaveBeenCalledWith('Nombre');
    expect(mockSetRut).toHaveBeenCalledWith('1-9');
    expect(mockSetBirthDate).toHaveBeenCalledWith('2000-01-01');
    expect(mockSetGender).toHaveBeenCalledWith('F');
    expect(mockSetDiagnosis).toHaveBeenCalledWith('Dx');
    expect(mockSetClinicalNote).toHaveBeenCalledWith('Nota');
    expect(mockAddToast).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('Datos completados')
    );
  });

  it('falls back to AI when pdf text extraction fails', async () => {
    const { extractTextFromPdfFile, fetchUrlAsArrayBuffer } = await import('@use-cases/attachments');
    const {
      extractAndNormalizePatientText,
      extractPatientDataFromTextAI,
    } = await import('@use-cases/patient/extraction');

    (extractTextFromPdfFile as any).mockResolvedValue('');
    (fetchUrlAsArrayBuffer as any).mockResolvedValue(new ArrayBuffer(8));
    (extractAndNormalizePatientText as any).mockReturnValue({});
    (extractPatientDataFromTextAI as any).mockResolvedValue({
      name: 'AI Name',
      rut: '2-7',
      birthDate: '1999-12-01',
      gender: 'M',
    });

    const { result } = buildHook();
    const file: AttachedFile = {
      id: 'f2',
      name: 'doc.pdf',
      mimeType: 'application/pdf',
      driveUrl: 'http://example.com/doc.pdf',
      size: 100,
      uploadedAt: Date.now(),
    };

    await act(async () => {
      await result.current.handleExtractFromAttachments([file], {
        name: '',
        rut: '',
        birthDate: '',
        gender: '',
        diagnosis: '',
        clinicalNote: '',
      });
    });

    expect(mockSetName).toHaveBeenCalledWith('Ai Name');
    expect(mockSetRut).toHaveBeenCalledWith('2-7');
  });
});
