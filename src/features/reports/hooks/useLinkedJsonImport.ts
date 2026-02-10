import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttachedFile, PatientRecord, User } from '@shared/types';
import type { ReportRecord } from '@domain/report';
import { parseClinicalReportJsonPayload } from '@features/reports/services/reportJsonService';
import type { LinkedJsonSource, ReportErrorPayload } from '@features/reports/types';


type UseLinkedJsonImportParams = {
  locationSearch: string;
  records: PatientRecord[];
  user: User | null;
  getLinkedJsonRaw: () => string | null;
  setLinkedJsonRaw: (value: string) => void;
  downloadPatientFileBlob: (url: string) => Promise<Blob>;
  downloadPatientFileBlobById: (patientId: string, fileId: string, existingFileName?: string) => Promise<Blob>;
  setRecord: (nextRecord: ReportRecord) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  emitReportJsonConsoleError: (
    stage: 'import' | 'update' | 'link',
    error: unknown,
    context: Record<string, unknown>
  ) => ReportErrorPayload;
  isCompatibleJsonAttachment: (fileName?: string, mimeType?: string) => boolean;
};

const parseLinkedJsonSource = (raw: string | null): LinkedJsonSource | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as (Partial<LinkedJsonSource> & { ts?: number; file?: Partial<AttachedFile> }) | null;
    if (!parsed || typeof parsed !== 'object') return null;
    const legacyFile = parsed.file && typeof parsed.file === 'object' ? parsed.file : null;
    const patientId = typeof parsed.patientId === 'string' ? parsed.patientId : null;
    const fileId = typeof parsed.fileId === 'string'
      ? parsed.fileId
      : typeof legacyFile?.id === 'string'
        ? legacyFile.id
        : null;

    if (!patientId || !fileId) return null;

    const fileName = typeof parsed.fileName === 'string'
      ? parsed.fileName
      : typeof legacyFile?.name === 'string'
        ? legacyFile.name
        : undefined;
    const mimeType = typeof parsed.mimeType === 'string'
      ? parsed.mimeType
      : typeof legacyFile?.mimeType === 'string'
        ? legacyFile.mimeType
        : undefined;
    const driveUrl = typeof parsed.driveUrl === 'string'
      ? parsed.driveUrl
      : typeof legacyFile?.driveUrl === 'string'
        ? legacyFile.driveUrl
        : undefined;

    return { patientId, fileId, fileName, mimeType, driveUrl };
  } catch (_error) {
    return null;
  }
};

export const useLinkedJsonImport = ({
  locationSearch,
  records,
  user,
  getLinkedJsonRaw,
  setLinkedJsonRaw,
  downloadPatientFileBlob,
  downloadPatientFileBlobById,
  setRecord,
  addToast,
  emitReportJsonConsoleError,
  isCompatibleJsonAttachment,
}: UseLinkedJsonImportParams) => {
  const importedAttachmentRef = useRef<string>('');
  const unresolvedLinkReportRef = useRef<string>('');
  const [linkedJsonSource, setLinkedJsonSource] = useState<LinkedJsonSource | null>(null);

  const resolveLinkedJsonSource = useCallback((): LinkedJsonSource | null => {
    const params = new URLSearchParams(locationSearch);
    const queryPatientId = params.get('patientId');
    const queryFileId = params.get('fileId');
    const sessionSource = parseLinkedJsonSource(getLinkedJsonRaw());
    const patientId = queryPatientId || sessionSource?.patientId || null;
    const fileId = queryFileId || sessionSource?.fileId || null;

    if (!patientId || !fileId) return null;

    const patient = records.find((item) => item.id === patientId);
    const matchingSessionSource = (
      sessionSource &&
      sessionSource.patientId === patientId &&
      sessionSource.fileId === fileId
    ) ? sessionSource : null;
    const attachedFile =
      (patient?.attachedFiles || []).find((item) => item.id === fileId)
      || records.flatMap((item) => item.attachedFiles || []).find((item) => item.id === fileId);

    const resolved: LinkedJsonSource = {
      patientId,
      fileId,
      fileName: attachedFile?.name || matchingSessionSource?.fileName,
      mimeType: attachedFile?.mimeType || matchingSessionSource?.mimeType,
      driveUrl: attachedFile?.driveUrl || matchingSessionSource?.driveUrl,
    };

    if (!isCompatibleJsonAttachment(resolved.fileName, resolved.mimeType)) return null;

    setLinkedJsonRaw(JSON.stringify({
      patientId: resolved.patientId,
      fileId: resolved.fileId,
      fileName: resolved.fileName,
      mimeType: resolved.mimeType,
      driveUrl: resolved.driveUrl,
      ts: Date.now(),
    }));
    return resolved;
  }, [getLinkedJsonRaw, isCompatibleJsonAttachment, locationSearch, records, setLinkedJsonRaw]);

  useEffect(() => {
    const source = resolveLinkedJsonSource();
    if (!source) {
      const params = new URLSearchParams(locationSearch);
      if (!params.get('patientId') && !params.get('fileId')) {
        setLinkedJsonSource(null);
        importedAttachmentRef.current = '';
        unresolvedLinkReportRef.current = '';
      } else {
        const unresolvedKey = `${locationSearch}::${records.length}`;
        if (unresolvedLinkReportRef.current !== unresolvedKey) {
          unresolvedLinkReportRef.current = unresolvedKey;
          emitReportJsonConsoleError('link', new Error('Unable to resolve linked JSON source'), {
            locationSearch,
            linkedSession: getLinkedJsonRaw(),
            recordsLoaded: records.length,
          });
        }
      }
      return;
    }
    unresolvedLinkReportRef.current = '';

    const importKey = `${source.patientId}:${source.fileId}`;
    const alreadyLinked = (
      linkedJsonSource &&
      linkedJsonSource.patientId === source.patientId &&
      linkedJsonSource.fileId === source.fileId
    );
    if (alreadyLinked && importedAttachmentRef.current === importKey) return;
    importedAttachmentRef.current = importKey;

    let cancelled = false;
    (async () => {
      try {
        if (typeof console !== 'undefined') {
          console.info('[ClinicalReportJSON]', {
            stage: 'import-start',
            patientId: source.patientId,
            fileId: source.fileId,
            fileName: source.fileName || null,
            hasDriveUrl: Boolean(source.driveUrl),
            locationSearch,
          });
        }
        let blob: Blob | null = null;
        let driveUrlError: unknown = null;

        if (source.driveUrl) {
          try {
            blob = await downloadPatientFileBlob(source.driveUrl);
          } catch (error) {
            driveUrlError = error;
            if (typeof console !== 'undefined') {
              console.warn('[ClinicalReportJSON]', {
                stage: 'drive-url-fallback',
                patientId: source.patientId,
                fileId: source.fileId,
                errorMessage: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }

        if (!blob) {
          blob = await downloadPatientFileBlobById(source.patientId, source.fileId, source.fileName);
        }

        const jsonContent = await blob.text();
        const parsed = parseClinicalReportJsonPayload(jsonContent);
        if (!parsed) {
          throw new Error(`Invalid report json (size=${jsonContent.length})`);
        }
        if (cancelled) return;
        setRecord(parsed.payload.report);
        setLinkedJsonSource(source);
        if (driveUrlError) {
          setLinkedJsonRaw(JSON.stringify({
            patientId: source.patientId,
            fileId: source.fileId,
            fileName: source.fileName,
            mimeType: source.mimeType,
            ts: Date.now(),
          }));
        }
        if (typeof console !== 'undefined') {
          console.info('[ClinicalReportJSON]', {
            stage: 'import-success',
            patientId: source.patientId,
            fileId: source.fileId,
            payloadSource: parsed.source,
            reportTitle: parsed.payload.report.title,
          });
        }
        addToast('success', 'Informe JSON cargado en edición.');
      } catch (error) {
        if (cancelled) return;
        importedAttachmentRef.current = '';
        if (error instanceof Error && error.message.includes('User not authenticated')) {
          emitReportJsonConsoleError('import', error, {
            patientId: source.patientId,
            fileId: source.fileId,
            fileName: source.fileName || null,
            hasDriveUrl: Boolean(source.driveUrl),
            locationSearch,
            userAuthenticated: Boolean(user),
          });
          return;
        }
        const report = emitReportJsonConsoleError('import', error, {
          patientId: source.patientId,
          fileId: source.fileId,
          fileName: source.fileName || null,
          hasDriveUrl: Boolean(source.driveUrl),
          locationSearch,
          userAuthenticated: Boolean(user),
          linkedSession: getLinkedJsonRaw(),
        });
        addToast('error', `No se pudo abrir el informe JSON seleccionado (reporte: ${report.reportId}).`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    addToast,
    downloadPatientFileBlob,
    downloadPatientFileBlobById,
    emitReportJsonConsoleError,
    getLinkedJsonRaw,
    linkedJsonSource,
    locationSearch,
    records,
    resolveLinkedJsonSource,
    setLinkedJsonRaw,
    setRecord,
    user,
  ]);

  return {
    linkedJsonSource,
    setLinkedJsonSource,
    resolveLinkedJsonSource,
  };
};
