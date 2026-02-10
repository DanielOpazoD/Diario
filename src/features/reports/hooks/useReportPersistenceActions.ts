import { useCallback, useState } from 'react';
import type {
  AttachedFile,
  PatientCreateInput,
  PatientRecord,
  User,
} from '@shared/types';
import type { ReportRecord } from '@domain/report';
import {
  buildReportAssetUploads,
  updateLinkedReportJsonAttachment,
} from '@features/reports/services/reportPersistenceAdapter';
import type { LinkedJsonSource, ReportErrorPayload } from '@features/reports/types';

type UseReportPersistenceActionsParams = {
  addPatient: (patient: PatientRecord) => void;
  updatePatient: (patient: PatientRecord) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  savePatientRecord: (patientData: PatientCreateInput, existing: PatientRecord | null) => {
    patient: PatientRecord;
    isUpdate: boolean;
    message: string;
  };
  uploadPatientFile: (file: File, patientId: string) => Promise<AttachedFile>;
  updatePatientFileById: (
    file: File,
    patientId: string,
    fileId: string,
    existingFileName?: string
  ) => Promise<AttachedFile>;
  buildPatientPayload: () => { patientData: PatientCreateInput; typeLabel: string } | null;
  buildDefaultReportFileNameBase: (patientNameOverride?: string) => string;
  generatePdfAsBlob: () => Promise<Blob>;
  record: ReportRecord;
  linkedJsonSource: LinkedJsonSource | null;
  setLinkedJsonSource: (source: LinkedJsonSource) => void;
  resolveLinkedJsonSource: () => LinkedJsonSource | null;
  records: PatientRecord[];
  isCompatibleJsonAttachment: (fileName?: string, mimeType?: string) => boolean;
  setLinkedJsonRaw: (value: string) => void;
  getLinkedJsonRaw: () => string | null;
  locationSearch: string;
  user: User | null;
  emitReportJsonConsoleError: (
    stage: 'import' | 'update' | 'link',
    error: unknown,
    context: Record<string, unknown>
  ) => ReportErrorPayload;
};

export const useReportPersistenceActions = ({
  addPatient,
  updatePatient,
  addToast,
  savePatientRecord,
  uploadPatientFile,
  updatePatientFileById,
  buildPatientPayload,
  buildDefaultReportFileNameBase,
  generatePdfAsBlob,
  record,
  linkedJsonSource,
  setLinkedJsonSource,
  resolveLinkedJsonSource,
  records,
  isCompatibleJsonAttachment,
  setLinkedJsonRaw,
  getLinkedJsonRaw,
  locationSearch,
  user,
  emitReportJsonConsoleError,
}: UseReportPersistenceActionsParams) => {
  const [isSavingLinkedJson, setIsSavingLinkedJson] = useState(false);

  const handleCreatePatientWithPdf = useCallback(async () => {
    const payload = buildPatientPayload();
    if (!payload) return;

    const result = savePatientRecord(payload.patientData, null);
    addPatient(result.patient);

    const fileNameBase = buildDefaultReportFileNameBase(payload.patientData.name);
    const {
      attachments: attachedFiles,
      failedCount,
      totalUploads,
      pdfGenerationFailed,
    } = await buildReportAssetUploads({
      patient: {
        id: result.patient.id,
        name: payload.patientData.name,
        rut: payload.patientData.rut,
        date: payload.patientData.date,
      },
      record,
      fileNameBase,
      uploadPatientFile,
      generatePdfAsBlob,
    });

    if (pdfGenerationFailed) {
      addToast('error', 'Paciente creado, pero no se pudo generar el PDF estilo impresion.');
    }

    if (attachedFiles.length > 0) {
      updatePatient({
        ...result.patient,
        attachedFiles: [...(result.patient.attachedFiles || []), ...attachedFiles],
      });
    }

    if (failedCount === 0 && attachedFiles.length === totalUploads) {
      addToast('success', 'Paciente creado y adjuntos PDF/JSON guardados.');
      return;
    }
    if (attachedFiles.length > 0) {
      addToast('info', 'Paciente creado con adjuntos parciales (revisa PDF/JSON en archivos).');
      return;
    }
    addToast('error', 'Paciente creado, pero no se pudieron adjuntar PDF/JSON.');
  }, [
    addPatient,
    addToast,
    buildDefaultReportFileNameBase,
    buildPatientPayload,
    generatePdfAsBlob,
    record,
    savePatientRecord,
    updatePatient,
    uploadPatientFile,
  ]);

  const handleUpdateLinkedJson = useCallback(async () => {
    const source = linkedJsonSource || resolveLinkedJsonSource();
    if (!source) {
      const report = emitReportJsonConsoleError('link', new Error('Report not linked to JSON source'), {
        locationSearch,
        linkedSession: getLinkedJsonRaw(),
      });
      addToast('info', 'Este informe no está vinculado a un JSON existente.');
      addToast('info', `Reporte consola: ${report.reportId}`);
      return;
    }
    if (!linkedJsonSource) {
      setLinkedJsonSource(source);
    }

    const currentPatient = records.find((item) => item.id === source.patientId);
    const existingFile = (currentPatient?.attachedFiles || []).find((item) => item.id === source.fileId);
    const existingFileName = existingFile?.name || source.fileName;
    const existingMimeType = existingFile?.mimeType || source.mimeType;
    if (!isCompatibleJsonAttachment(existingFileName, existingMimeType)) {
      addToast('error', 'No se encontró el JSON asociado para actualizar.');
      return;
    }

    setIsSavingLinkedJson(true);
    try {
      const { mergedFile, nextSource, sessionRaw } = await updateLinkedReportJsonAttachment({
        source,
        currentPatient,
        existingFile,
        record,
        buildDefaultReportFileNameBase,
        updatePatientFileById,
      });

      if (currentPatient) {
        const currentAttachedFiles = currentPatient.attachedFiles || [];
        const hasExisting = currentAttachedFiles.some((item) => item.id === source.fileId);
        const nextAttachedFiles = hasExisting
          ? currentAttachedFiles.map((item) => (item.id === source.fileId ? mergedFile : item))
          : [...currentAttachedFiles, mergedFile];

        updatePatient({
          ...currentPatient,
          attachedFiles: nextAttachedFiles,
        });
      }
      setLinkedJsonSource(nextSource);
      setLinkedJsonRaw(sessionRaw);
      addToast('success', 'Informe JSON actualizado en Firebase.');
    } catch (error) {
      const report = emitReportJsonConsoleError('update', error, {
        patientId: source.patientId,
        fileId: source.fileId,
        fileName: source.fileName || existingFileName || null,
        userAuthenticated: Boolean(user),
        locationSearch,
        linkedSession: getLinkedJsonRaw(),
      });
      addToast('error', `No se pudo actualizar el JSON del informe (reporte: ${report.reportId}).`);
    } finally {
      setIsSavingLinkedJson(false);
    }
  }, [
    addToast,
    buildDefaultReportFileNameBase,
    emitReportJsonConsoleError,
    getLinkedJsonRaw,
    isCompatibleJsonAttachment,
    linkedJsonSource,
    locationSearch,
    record,
    records,
    resolveLinkedJsonSource,
    setLinkedJsonRaw,
    setLinkedJsonSource,
    updatePatient,
    updatePatientFileById,
    user,
  ]);

  return {
    isSavingLinkedJson,
    handleCreatePatientWithPdf,
    handleUpdateLinkedJson,
  };
};
