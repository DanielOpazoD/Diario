import { describe, expect, it, vi } from 'vitest';
import type { ReportRecord } from '@domain/report';
import {
  buildReportAssetUploads,
  updateLinkedReportJsonAttachment,
} from '@features/reports/services/reportPersistenceAdapter';

const baseReportRecord: ReportRecord = {
  version: '1',
  templateId: '2',
  title: 'Evolucion medica',
  patientFields: [],
  sections: [],
  medico: '',
  especialidad: '',
};

describe('reportPersistenceAdapter', () => {
  it('uploads JSON even when PDF generation fails', async () => {
    const uploadPatientFile = vi.fn(async (file: File, patientId: string) => ({
      id: `${patientId}-${file.name}`,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: Date.now(),
      driveUrl: `https://example.com/${file.name}`,
    }));

    const result = await buildReportAssetUploads({
      patient: {
        id: 'p-1',
        name: 'Daniel Opazo',
        rut: '17.752.753-K',
        date: '2026-02-19',
      },
      record: baseReportRecord,
      fileNameBase: 'evolucion-medica',
      uploadPatientFile,
      generatePdfAsBlob: async () => {
        throw new Error('pdf-failed');
      },
    });

    expect(result.pdfGenerationFailed).toBe(true);
    expect(result.totalUploads).toBe(1);
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].name.endsWith('.json')).toBe(true);
  });

  it('updates and merges linked JSON metadata', async () => {
    const updatePatientFileById = vi.fn(async () => ({
      id: 'file-1',
      name: 'informe-actualizado.json',
      mimeType: 'application/json',
      size: 321,
      uploadedAt: 1000,
      driveUrl: 'https://example.com/informe-actualizado.json',
    }));

    const result = await updateLinkedReportJsonAttachment({
      source: { patientId: 'p-1', fileId: 'file-1', fileName: 'informe.json' },
      currentPatient: {
        id: 'p-1',
        createdAt: 1,
        name: 'Daniel Opazo',
        rut: '17.752.753-K',
        date: '2026-02-19',
        birthDate: '',
        gender: '',
        type: 'Policlinico',
        typeId: 'policlinico',
        diagnosis: '',
        clinicalNote: '',
        entryTime: '',
        exitTime: '',
        pendingTasks: [],
        attachedFiles: [],
        driveFolderId: null,
      },
      existingFile: undefined,
      record: baseReportRecord,
      buildDefaultReportFileNameBase: () => 'informe-clinico',
      updatePatientFileById,
    });

    expect(result.mergedFile.name).toBe('informe-actualizado.json');
    expect(result.nextSource.fileId).toBe('file-1');
    expect(result.sessionRaw).toContain('"patientId":"p-1"');
  });
});
