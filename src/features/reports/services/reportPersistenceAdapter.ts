import type { AttachedFile, PatientRecord } from '@shared/types';
import type { ReportRecord } from '@domain/report';
import { stringifyClinicalReportJsonPayload } from '@features/reports/services/reportJsonService';
import type { LinkedJsonSource } from '@features/reports/types';

type PatientSnapshot = {
  id: string;
  name: string;
  rut: string;
  date: string;
};

type UploadPatientFile = (file: File, patientId: string) => Promise<AttachedFile>;

type UpdatePatientFileById = (
  file: File,
  patientId: string,
  fileId: string,
  existingFileName?: string
) => Promise<AttachedFile>;

type BuildReportAssetsParams = {
  patient: PatientSnapshot;
  record: ReportRecord;
  fileNameBase: string;
  uploadPatientFile: UploadPatientFile;
  generatePdfAsBlob: () => Promise<Blob>;
};

type BuildReportAssetsResult = {
  attachments: AttachedFile[];
  failedCount: number;
  totalUploads: number;
  pdfGenerationFailed: boolean;
};

export const buildReportAssetUploads = async ({
  patient,
  record,
  fileNameBase,
  uploadPatientFile,
  generatePdfAsBlob,
}: BuildReportAssetsParams): Promise<BuildReportAssetsResult> => {
  let pdfFile: File | null = null;
  let pdfGenerationFailed = false;

  try {
    const blob = await generatePdfAsBlob();
    pdfFile = new File([blob], `${fileNameBase}.pdf`, { type: 'application/pdf' });
  } catch (_error) {
    pdfGenerationFailed = true;
  }

  const jsonPayload = stringifyClinicalReportJsonPayload({
    report: record,
    patient,
  });
  const jsonFile = new File([jsonPayload], `${fileNameBase}.json`, { type: 'application/json' });

  const uploadEntries: Array<{ kind: 'pdf' | 'json'; file: File }> = [];
  if (pdfFile) uploadEntries.push({ kind: 'pdf', file: pdfFile });
  uploadEntries.push({ kind: 'json', file: jsonFile });

  const uploadResults = await Promise.allSettled(
    uploadEntries.map(async (entry) => {
      const uploaded = await uploadPatientFile(entry.file, patient.id);
      if (entry.kind === 'pdf') {
        return {
          ...uploaded,
          category: 'report' as const,
          customTypeLabel: 'Informe clínico PDF',
        };
      }
      return {
        ...uploaded,
        category: 'report' as const,
        customTypeLabel: 'Informe clínico JSON',
      };
    })
  );

  const attachments = uploadResults.flatMap((result) => (
    result.status === 'fulfilled' ? [result.value] : []
  ));

  return {
    attachments,
    failedCount: uploadResults.length - attachments.length,
    totalUploads: uploadEntries.length,
    pdfGenerationFailed,
  };
};

type UpdateLinkedReportJsonParams = {
  source: LinkedJsonSource;
  currentPatient: PatientRecord | undefined;
  existingFile: AttachedFile | undefined;
  record: ReportRecord;
  buildDefaultReportFileNameBase: () => string;
  updatePatientFileById: UpdatePatientFileById;
};

type UpdateLinkedReportJsonResult = {
  mergedFile: AttachedFile;
  nextSource: LinkedJsonSource;
  sessionRaw: string;
};

export const updateLinkedReportJsonAttachment = async ({
  source,
  currentPatient,
  existingFile,
  record,
  buildDefaultReportFileNameBase,
  updatePatientFileById,
}: UpdateLinkedReportJsonParams): Promise<UpdateLinkedReportJsonResult> => {
  const jsonPayload = stringifyClinicalReportJsonPayload({
    report: record,
    patient: {
      id: source.patientId,
      name: currentPatient?.name || '',
      rut: currentPatient?.rut || '',
      date: currentPatient?.date || '',
    },
  });

  const existingFileName = existingFile?.name || source.fileName;
  const targetFileName = existingFileName || `${buildDefaultReportFileNameBase()}.json`;
  const updatedJsonFile = new File([jsonPayload], targetFileName, { type: 'application/json' });
  const uploaded = await updatePatientFileById(
    updatedJsonFile,
    source.patientId,
    source.fileId,
    existingFileName
  );

  const mergedFile: AttachedFile = {
    ...(existingFile || {
      id: source.fileId,
      name: uploaded.name,
      mimeType: 'application/json',
      size: uploaded.size,
      uploadedAt: uploaded.uploadedAt,
      driveUrl: uploaded.driveUrl,
    }),
    ...uploaded,
    mimeType: 'application/json',
    category: existingFile?.category || 'report',
    customTypeLabel: existingFile?.customTypeLabel || 'Informe clínico JSON',
  };

  const nextSource: LinkedJsonSource = {
    patientId: source.patientId,
    fileId: mergedFile.id,
    fileName: mergedFile.name,
    mimeType: mergedFile.mimeType,
    driveUrl: mergedFile.driveUrl,
  };

  return {
    mergedFile,
    nextSource,
    sessionRaw: JSON.stringify({
      patientId: source.patientId,
      fileId: mergedFile.id,
      fileName: mergedFile.name,
      mimeType: mergedFile.mimeType,
      driveUrl: mergedFile.driveUrl,
      ts: Date.now(),
    }),
  };
};
