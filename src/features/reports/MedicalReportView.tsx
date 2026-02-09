import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Printer, Save, SlidersHorizontal, PencilRuler, CalendarDays, UserRound, Link2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { useAppActions } from '@core/app/state/useAppActions';
import { useAppState } from '@core/app/state/useAppState';
import { AttachedFile, PatientCreateInput } from '@shared/types';
import { calculateAge, normalizeBirthDateInput } from '@shared/utils/dateUtils';
import { savePatientRecord } from '@use-cases/patient/save';
import {
  downloadPatientFileBlob,
  downloadPatientFileBlobById,
  updatePatientFileById,
  uploadPatientFile,
} from '@use-cases/attachments';
import { sanitizeFileName } from '@shared/utils/fileNames';
import {
  DEFAULT_REPORT_TEMPLATE_ID,
  REPORT_TEMPLATES,
  buildClinicalNote,
  createTemplateBaseline,
  findReportSectionContent,
  formatDateDMY,
} from '@domain/report';
import type { ReportRecord, ReportSection } from '@domain/report';
import PatientInfo from '@features/reports/components/PatientInfo';
import ClinicalSection from '@features/reports/components/ClinicalSection';
import Footer from '@features/reports/components/Footer';
import reportStyles from '@features/reports/reportStyles.css?raw';
import { logoUrls } from '@domain/report/institutionConfig';
import { useReportDraft } from '@features/reports/hooks/useReportDraft';
import { generateReportPdfBlob } from '@features/reports/services/reportPdfService';
import {
  parseClinicalReportJsonPayload,
  stringifyClinicalReportJsonPayload,
} from '@features/reports/services/reportJsonService';
import { safeSessionGetItem, safeSessionRemoveItem, safeSessionSetItem } from '@shared/utils/safeSessionStorage';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';

const createTemplate = (templateId: string): ReportRecord =>
  createTemplateBaseline(templateId);

const reportLogoStyle: React.CSSProperties = {
  position: 'absolute',
  top: '0mm',
  width: '18mm',
  maxWidth: '18mm',
  height: 'auto',
  opacity: 0.6,
  zIndex: 2,
  display: 'block',
};

const isJsonAttachment = (fileName: string, mimeType: string): boolean => (
  mimeType === 'application/json' || mimeType === 'text/json' || fileName.toLowerCase().endsWith('.json')
);

const normalizeFileToken = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isCompatibleJsonAttachment = (fileName?: string, mimeType?: string): boolean => {
  const hasName = typeof fileName === 'string' && fileName.trim().length > 0;
  const hasMime = typeof mimeType === 'string' && mimeType.trim().length > 0;
  if (!hasName && !hasMime) return true;
  if (isJsonAttachment(fileName || '', mimeType || '')) return true;
  // Metadata incompleta no debe bloquear import/update; solo se rechaza si ambos valores
  // existen y ambos indican claramente que no es JSON.
  return !hasName || !hasMime;
};

type LinkedJsonSource = {
  patientId: string;
  fileId: string;
  fileName?: string;
  mimeType?: string;
  driveUrl?: string;
};

const buildReportErrorId = (): string => (
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `report-${Date.now()}`
);

const emitReportJsonConsoleError = (
  stage: 'import' | 'update' | 'link',
  error: unknown,
  context: Record<string, unknown>
) => {
  const reportId = buildReportErrorId();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const payload = {
    reportId,
    stage,
    timestamp: new Date().toISOString(),
    errorMessage,
    ...context,
  };
  if (typeof console !== 'undefined') {
    console.error('[ClinicalReportJSON]', payload);
  }
  return payload;
};

const parseLinkedJsonSource = (raw: string | null): LinkedJsonSource | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as (Partial<LinkedJsonSource> & { ts?: number }) | null;
    if (!parsed || typeof parsed !== 'object') return null;
    const legacyFile = (
      'file' in parsed &&
      parsed.file &&
      typeof parsed.file === 'object'
    ) ? parsed.file as Partial<AttachedFile> : null;
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

const MedicalReportView: React.FC = () => {
  const { addPatient, updatePatient, addToast } = useAppActions();
  const { patientTypes, user, records } = useAppState();
  const location = useLocation();
  const hasLinkedImportParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Boolean(params.get('patientId') && params.get('fileId'));
  }, [location.search]);
  const { record, setRecord } = useReportDraft(
    user,
    createTemplate(DEFAULT_REPORT_TEMPLATE_ID),
    { skipRemoteLoad: hasLinkedImportParams }
  );
  const [activeEditTarget, setActiveEditTarget] = useState<
    | { type: 'record-title' }
    | { type: 'patient-section-title' }
    | { type: 'patient-field-label'; index: number }
    | { type: 'section-title'; index: number }
    | null
  >(null);
  const [isAdvancedEditing, setIsAdvancedEditing] = useState(false);
  const [isGlobalStructureEditing, setIsGlobalStructureEditing] = useState(false);
  const [sheetZoom, setSheetZoom] = useState(1);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const lastEditableRef = useRef<HTMLElement | null>(null);
  const importedAttachmentRef = useRef<string>('');
  const unresolvedLinkReportRef = useRef<string>('');
  const [linkedJsonSource, setLinkedJsonSource] = useState<LinkedJsonSource | null>(null);
  const [isSavingLinkedJson, setIsSavingLinkedJson] = useState(false);
  const [isResetTemplateModalOpen, setIsResetTemplateModalOpen] = useState(false);

  const defaultTypeId = useMemo(() => patientTypes[0]?.id || 'policlinico', [patientTypes]);
  const [selectedTypeId, setSelectedTypeId] = useState(defaultTypeId);

  useEffect(() => {
    if (!selectedTypeId && patientTypes.length > 0) {
      setSelectedTypeId(patientTypes[0].id);
    }
  }, [patientTypes, selectedTypeId]);

  const resolveLinkedJsonSource = useCallback((): LinkedJsonSource | null => {
    const params = new URLSearchParams(location.search);
    const queryPatientId = params.get('patientId');
    const queryFileId = params.get('fileId');
    const sessionSource = parseLinkedJsonSource(safeSessionGetItem(SESSION_KEYS.REPORT_LINKED_JSON));
    const patientId = queryPatientId || sessionSource?.patientId || null;
    const fileId = queryFileId || sessionSource?.fileId || null;

    if (!patientId || !fileId) {
      return null;
    }

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

    safeSessionSetItem(SESSION_KEYS.REPORT_LINKED_JSON, JSON.stringify({
      patientId: resolved.patientId,
      fileId: resolved.fileId,
      fileName: resolved.fileName,
      mimeType: resolved.mimeType,
      driveUrl: resolved.driveUrl,
      ts: Date.now(),
    }));
    return resolved;
  }, [location.search, records]);

  useEffect(() => {
    if (styleRef.current || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = 'report-style';
    style.textContent = reportStyles;
    document.head.appendChild(style);
    styleRef.current = style;

    const previousTheme = document.body.dataset.theme;
    document.body.classList.add('reports-print');
    document.body.dataset.theme = 'light';

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      document.body.classList.remove('reports-print');
      if (previousTheme) {
        document.body.dataset.theme = previousTheme;
      } else {
        delete document.body.dataset.theme;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('advanced-editing-active', isAdvancedEditing);
    return () => {
      document.body.classList.remove('advanced-editing-active');
    };
  }, [isAdvancedEditing]);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.classList.contains('note-area')) {
        lastEditableRef.current = target;
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !activeEditTarget) return;

      const insideSheet = target.closest('#sheet');
      if (!insideSheet) {
        setActiveEditTarget(null);
        return;
      }

      if (activeEditTarget.type === 'section-title' && !target.closest('.sec')) {
        setActiveEditTarget(null);
      }
      if (activeEditTarget.type === 'patient-field-label' && !target.closest('.patient-field-row')) {
        setActiveEditTarget(null);
      }
      if (activeEditTarget.type === 'patient-section-title' && !target.closest('#sec-datos')) {
        setActiveEditTarget(null);
      }
      if (activeEditTarget.type === 'record-title' && !target.closest('.title')) {
        setActiveEditTarget(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [activeEditTarget]);

  const handleActivateEdit = useCallback((target: typeof activeEditTarget) => {
    setActiveEditTarget(target);
  }, []);

  const handlePatientFieldChange = useCallback((index: number, value: string) => {
    setRecord((prev) => {
      const nextFields = [...prev.patientFields];
      nextFields[index] = { ...nextFields[index], value };
      let nextTitle = prev.title;
      const fieldId = nextFields[index]?.id;
      if (fieldId === 'finf' && prev.templateId === '2') {
        const formattedDate = value ? formatDateDMY(value) : '____';
        const templateTitle = REPORT_TEMPLATES['2']?.title || 'Evolución médica (____)';
        const isEvolutionTitle = prev.title.includes('Evolución médica') || prev.title === templateTitle;
        if (isEvolutionTitle) {
          if (templateTitle.includes('____')) {
            nextTitle = templateTitle.replace('____', formattedDate);
          } else if (prev.title.includes('____')) {
            nextTitle = prev.title.replace('____', formattedDate);
          } else if (prev.title.match(/\((.*?)\)/)) {
            nextTitle = prev.title.replace(/\((.*?)\)/, `(${formattedDate})`);
          } else {
            nextTitle = templateTitle;
          }
        }
      }
      return { ...prev, patientFields: nextFields, title: nextTitle };
    });
  }, []);

  const handlePatientLabelChange = useCallback((index: number, label: string) => {
    setRecord((prev) => {
      const nextFields = [...prev.patientFields];
      nextFields[index] = { ...nextFields[index], label };
      return { ...prev, patientFields: nextFields };
    });
  }, []);

  const handleRemovePatientField = useCallback((index: number) => {
    setRecord((prev) => ({
      ...prev,
      patientFields: prev.patientFields.filter((_, idx) => idx !== index),
    }));
  }, []);

  const handleSectionContentChange = useCallback((index: number, content: string) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], content };
      return { ...prev, sections: nextSections };
    });
  }, []);

  const handleSectionTitleChange = useCallback((index: number, title: string) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], title };
      return { ...prev, sections: nextSections };
    });
  }, []);

  const handleRemoveSection = useCallback((index: number) => {
    setRecord((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  }, []);

  const handleUpdateSectionMeta = useCallback((index: number, meta: Partial<ReportSection>) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], ...meta };
      return { ...prev, sections: nextSections };
    });
  }, []);

  const handleAddSection = useCallback(() => {
    setRecord((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: 'Sección personalizada', content: '' }],
    }));
  }, []);

  const handleAddClinicalUpdateSection = useCallback(() => {
    setRecord((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { title: 'Actualización clínica', content: '', kind: 'clinical-update', updateDate: '', updateTime: '' },
      ],
    }));
  }, []);

  const handleTemplateChange = useCallback((templateId: string) => {
    const template = REPORT_TEMPLATES[templateId];
    setRecord((prev) => {
      let nextTitle = template?.title || prev.title;
      if (templateId === '2') {
        const finf = prev.patientFields.find((field) => field.id === 'finf')?.value || '';
        const formattedDate = finf ? formatDateDMY(finf) : '____';
        if (nextTitle.includes('____')) {
          nextTitle = nextTitle.replace('____', formattedDate);
        } else if (nextTitle.match(/\((.*?)\)/)) {
          nextTitle = nextTitle.replace(/\((.*?)\)/, `(${formattedDate})`);
        }
      }

      return {
        ...prev,
        templateId,
        title: nextTitle,
      };
    });
  }, []);

  useEffect(() => {
    const birthDateField = record.patientFields.find((field) => field.id === 'fecnac');
    const ageField = record.patientFields.find((field) => field.id === 'edad');
    if (!birthDateField || !ageField) return;

    const normalizedBirthDate = normalizeBirthDateInput(birthDateField.value);
    const ageValue = normalizedBirthDate ? calculateAge(normalizedBirthDate) : '';

    if (ageField.value !== ageValue) {
      setRecord((prev) => ({
        ...prev,
        patientFields: prev.patientFields.map((field) =>
          field.id === 'edad' ? { ...field, value: ageValue === 'N/A' ? '' : ageValue } : field
        ),
      }));
    }
  }, [record.patientFields]);

  useEffect(() => {
    const source = resolveLinkedJsonSource();
    if (!source) {
      const params = new URLSearchParams(location.search);
      if (!params.get('patientId') && !params.get('fileId')) {
        setLinkedJsonSource(null);
        importedAttachmentRef.current = '';
        unresolvedLinkReportRef.current = '';
      } else {
        const unresolvedKey = `${location.search}::${records.length}`;
        if (unresolvedLinkReportRef.current !== unresolvedKey) {
          unresolvedLinkReportRef.current = unresolvedKey;
          emitReportJsonConsoleError('link', new Error('Unable to resolve linked JSON source'), {
            locationSearch: location.search,
            linkedSession: safeSessionGetItem(SESSION_KEYS.REPORT_LINKED_JSON),
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
            locationSearch: location.search,
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
          // Refresh in-memory source to avoid retrying stale URLs.
          safeSessionSetItem(SESSION_KEYS.REPORT_LINKED_JSON, JSON.stringify({
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
            locationSearch: location.search,
            userAuthenticated: Boolean(user),
          });
          return;
        }
        const report = emitReportJsonConsoleError('import', error, {
          patientId: source.patientId,
          fileId: source.fileId,
          fileName: source.fileName || null,
          hasDriveUrl: Boolean(source.driveUrl),
          locationSearch: location.search,
          userAuthenticated: Boolean(user),
          linkedSession: safeSessionGetItem(SESSION_KEYS.REPORT_LINKED_JSON),
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
    linkedJsonSource,
    location.search,
    resolveLinkedJsonSource,
    setRecord,
    user,
  ]);

  const getFieldValue = useCallback(
    (fieldId: string) => record.patientFields.find((field) => field.id === fieldId)?.value?.trim() || '',
    [record.patientFields]
  );
  const reportPatientName = useMemo(() => getFieldValue('nombre') || 'Paciente sin nombre', [getFieldValue]);
  const reportPatientRut = useMemo(() => getFieldValue('rut') || 'Sin RUT', [getFieldValue]);
  const reportDateRaw = useMemo(() => getFieldValue('finf'), [getFieldValue]);
  const reportDateDisplay = useMemo(
    () => (reportDateRaw ? formatDateDMY(reportDateRaw) : 'Sin fecha'),
    [reportDateRaw]
  );
  const reportFileDate = useMemo(
    () => (reportDateRaw ? formatDateDMY(reportDateRaw) : format(new Date(), 'dd-MM-yyyy')),
    [reportDateRaw]
  );
  const reportDocumentType = useMemo(
    () => REPORT_TEMPLATES[record.templateId]?.name || record.title || 'informe_clinico',
    [record.templateId, record.title]
  );

  const buildDefaultReportFileNameBase = useCallback((patientNameOverride?: string) => {
    const patientName = normalizeFileToken((patientNameOverride || getFieldValue('nombre') || 'paciente').trim());
    const documentType = normalizeFileToken(reportDocumentType);
    return sanitizeFileName(`${documentType}-${reportFileDate}-${patientName}`) || 'informe_clinico';
  }, [getFieldValue, reportDocumentType, reportFileDate]);

  const buildPatientPayload = useCallback(() => {
    const name = getFieldValue('nombre');
    const rut = getFieldValue('rut');
    const birthDate = normalizeBirthDateInput(getFieldValue('fecnac'));
    const gender = '';

    if (!name || !rut) {
      addToast('error', 'Ingresa nombre completo y RUT para crear el paciente.');
      return null;
    }

    const diagnosis = findReportSectionContent(record.sections, ['diagnost']);
    const clinicalNote = buildClinicalNote(record.sections);

    const typeConfig = patientTypes.find((type) => type.id === selectedTypeId) || patientTypes[0];
    const typeLabel = typeConfig?.label || 'Policlínico';

    const patientData: PatientCreateInput = {
      name,
      rut,
      birthDate,
      gender,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: typeLabel,
      typeId: typeConfig?.id || selectedTypeId,
      diagnosis,
      clinicalNote,
      entryTime: '',
      exitTime: '',
      pendingTasks: [],
      attachedFiles: [],
      driveFolderId: null,
    };

    return { patientData, typeLabel };
  }, [addToast, getFieldValue, patientTypes, record.sections, selectedTypeId]);

  const handleToolbarCommand = useCallback((command: string) => {
    if (command === 'zoom-in') {
      setSheetZoom((prev) => Math.min(1.35, Number((prev + 0.05).toFixed(2))));
      return;
    }
    if (command === 'zoom-out') {
      setSheetZoom((prev) => Math.max(0.75, Number((prev - 0.05).toFixed(2))));
      return;
    }

    const target = lastEditableRef.current;
    if (!target) return;
    target.focus();
    document.execCommand(command);
  }, []);

  const resolvedLinkedJsonSource = useMemo(
    () => linkedJsonSource || resolveLinkedJsonSource(),
    [linkedJsonSource, resolveLinkedJsonSource]
  );

  const handleOpenLinkedJsonFile = useCallback(() => {
    const source = resolvedLinkedJsonSource;
    if (!source?.driveUrl) {
      addToast('info', 'No hay URL disponible para abrir el JSON vinculado.');
      return;
    }
    window.open(source.driveUrl, '_blank', 'noopener,noreferrer');
  }, [addToast, resolvedLinkedJsonSource]);

  const hasLinkedJsonSource = useMemo(() => Boolean(resolvedLinkedJsonSource), [resolvedLinkedJsonSource]);

  useEffect(() => {
    const contextPayload = {
      patientName: reportPatientName,
      patientRut: reportPatientRut,
      reportDate: reportDateDisplay,
      templateName: REPORT_TEMPLATES[record.templateId]?.name || 'Informe clínico',
      updatedAt: Date.now(),
    };
    safeSessionSetItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT, JSON.stringify(contextPayload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('medidiario:report-context'));
    }
  }, [record.templateId, reportDateDisplay, reportPatientName, reportPatientRut]);

  useEffect(() => {
    return () => {
      safeSessionRemoveItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('medidiario:report-context'));
      }
    };
  }, []);

  const generatePdfAsBlob = useCallback(async (): Promise<Blob> => {
    return generateReportPdfBlob(record);
  }, [record]);

  const handleOpenResetTemplateModal = useCallback(() => {
    setIsResetTemplateModalOpen(true);
  }, []);

  const handleCloseResetTemplateModal = useCallback(() => {
    setIsResetTemplateModalOpen(false);
  }, []);

  const handleConfirmResetTemplate = useCallback(() => {
    setRecord(createTemplate(record.templateId));
    setIsResetTemplateModalOpen(false);
    addToast('info', 'Planilla reiniciada en blanco.');
  }, [addToast, record.templateId, setRecord]);

  const handleCreatePatientWithPdf = useCallback(async () => {
    const payload = buildPatientPayload();
    if (!payload) return;

    const result = savePatientRecord(payload.patientData, null);
    addPatient(result.patient);

    const fileNameBase = buildDefaultReportFileNameBase(payload.patientData.name);

    let pdfFile: File | null = null;
    try {
      const blob = await generatePdfAsBlob();
      pdfFile = new File([blob], `${fileNameBase}.pdf`, { type: 'application/pdf' });
    } catch (error) {
      addToast('error', 'Paciente creado, pero no se pudo generar el PDF estilo impresión.');
    }

    const jsonPayload = stringifyClinicalReportJsonPayload({
      report: record,
      patient: {
        id: result.patient.id,
        name: payload.patientData.name,
        rut: payload.patientData.rut,
        date: payload.patientData.date,
      },
    });
    const jsonFile = new File([jsonPayload], `${fileNameBase}.json`, { type: 'application/json' });

    const uploadEntries: Array<{ kind: 'pdf' | 'json'; file: File }> = [];
    if (pdfFile) {
      uploadEntries.push({ kind: 'pdf', file: pdfFile });
    }
    uploadEntries.push({ kind: 'json', file: jsonFile });

    const uploadResults = await Promise.allSettled(
      uploadEntries.map(async (entry) => {
        const uploaded = await uploadPatientFile(entry.file, result.patient.id);
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

    const attachedFiles = uploadResults.flatMap((resultItem) => (
      resultItem.status === 'fulfilled' ? [resultItem.value] : []
    ));

    if (attachedFiles.length > 0) {
      updatePatient({
        ...result.patient,
        attachedFiles: [...(result.patient.attachedFiles || []), ...attachedFiles],
      });
    }

    const failedCount = uploadResults.length - attachedFiles.length;
    if (failedCount === 0 && attachedFiles.length === uploadEntries.length) {
      addToast('success', 'Paciente creado y adjuntos PDF/JSON guardados.');
      return;
    }
    if (attachedFiles.length > 0) {
      addToast('info', 'Paciente creado con adjuntos parciales (revisa PDF/JSON en archivos).');
      return;
    }
    addToast('error', 'Paciente creado, pero no se pudieron adjuntar PDF/JSON.');
  }, [addPatient, addToast, buildDefaultReportFileNameBase, buildPatientPayload, generatePdfAsBlob, updatePatient]);

  const handleUpdateLinkedJson = useCallback(async () => {
    const source = linkedJsonSource || resolveLinkedJsonSource();
    if (!source) {
      const report = emitReportJsonConsoleError('link', new Error('Report not linked to JSON source'), {
        locationSearch: location.search,
        linkedSession: safeSessionGetItem(SESSION_KEYS.REPORT_LINKED_JSON),
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
      const jsonPayload = stringifyClinicalReportJsonPayload({
        report: record,
        patient: {
          id: source.patientId,
          name: currentPatient?.name || '',
          rut: currentPatient?.rut || '',
          date: currentPatient?.date || '',
        },
      });
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
        category: (existingFile?.category || 'report'),
        customTypeLabel: (existingFile?.customTypeLabel || 'Informe clínico JSON'),
      };

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
      setLinkedJsonSource({
        patientId: source.patientId,
        fileId: mergedFile.id,
        fileName: mergedFile.name,
        mimeType: mergedFile.mimeType,
        driveUrl: mergedFile.driveUrl,
      });
      safeSessionSetItem(SESSION_KEYS.REPORT_LINKED_JSON, JSON.stringify({
        patientId: source.patientId,
        fileId: mergedFile.id,
        fileName: mergedFile.name,
        mimeType: mergedFile.mimeType,
        driveUrl: mergedFile.driveUrl,
        ts: Date.now(),
      }));
      addToast('success', 'Informe JSON actualizado en Firebase.');
    } catch (error) {
      const report = emitReportJsonConsoleError('update', error, {
        patientId: source.patientId,
        fileId: source.fileId,
        fileName: source.fileName || existingFileName || null,
        userAuthenticated: Boolean(user),
        locationSearch: location.search,
        linkedSession: safeSessionGetItem(SESSION_KEYS.REPORT_LINKED_JSON),
      });
      addToast('error', `No se pudo actualizar el JSON del informe (reporte: ${report.reportId}).`);
    } finally {
      setIsSavingLinkedJson(false);
    }
  }, [addToast, buildDefaultReportFileNameBase, linkedJsonSource, location.search, record, records, resolveLinkedJsonSource, updatePatient, user]);

  const handlePrint = () => {
    window.print();
  };

  const templateOptions = Object.values(REPORT_TEMPLATES);

  return (
    <div className="clinical-report-root report-focus-mode">
      <div className="topbar modern-topbar report-shell-header">
        <div className="report-context-strip">
          <div className="report-context-item">
            <UserRound className="report-context-icon" />
            <div className="report-context-text">
              <span className="report-context-label">Paciente</span>
              <span className="report-context-value">{reportPatientName}</span>
            </div>
          </div>
          <div className="report-context-item">
            <span className="report-context-label">RUT</span>
            <span className="report-context-value">{reportPatientRut}</span>
          </div>
          <div className="report-context-item">
            <CalendarDays className="report-context-icon" />
            <div className="report-context-text">
              <span className="report-context-label">Fecha informe</span>
              <span className="report-context-value">{reportDateDisplay}</span>
            </div>
          </div>
          <div className="report-context-item report-context-status">
            <span className={`report-status-dot ${isSavingLinkedJson ? 'is-saving' : hasLinkedJsonSource ? 'is-linked' : 'is-draft'}`} />
            <span className="report-context-value">
              {isSavingLinkedJson ? 'Guardando JSON...' : hasLinkedJsonSource ? 'JSON vinculado' : 'Borrador local/Firebase'}
            </span>
          </div>
        </div>
        <div className="topbar-main modern-topbar-main report-command-row">
          <div className="action-group compact report-group report-group-left">
            <select
              className="template-select compact"
              value={record.templateId}
              onChange={e => handleTemplateChange(e.target.value)}
            >
              {templateOptions.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="template-update-btn"
              onClick={handleAddClinicalUpdateSection}
              title="Agregar actualización clínica"
            >
              <Plus />
              <span>Act. clínica</span>
            </button>
            <button type="button" className="action-btn icon" onClick={() => setIsAdvancedEditing((prev) => !prev)} title="Edición avanzada">
              <PencilRuler />
            </button>
            <button type="button" className="action-btn icon" onClick={() => setIsGlobalStructureEditing((prev) => !prev)} title="Editar estructura">
              <SlidersHorizontal />
            </button>
          </div>
          {isAdvancedEditing && (
            <div className="editor-toolbar report-editor-toolbar" role="toolbar" aria-label="Herramientas de edición avanzada">
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleToolbarCommand('bold')} title="Negrita">
                <span className="toolbar-icon">B</span>
              </button>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleToolbarCommand('italic')} title="Cursiva">
                <span className="toolbar-icon toolbar-italic">I</span>
              </button>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleToolbarCommand('underline')} title="Subrayado">
                <span className="toolbar-icon toolbar-underline">S</span>
              </button>
              <span className="toolbar-divider" aria-hidden="true" />
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleToolbarCommand('outdent')} title="Reducir sangría">
                <span className="toolbar-icon">⇤</span>
              </button>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleToolbarCommand('indent')} title="Aumentar sangría">
                <span className="toolbar-icon">⇥</span>
              </button>
              <span className="toolbar-divider" aria-hidden="true" />
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleToolbarCommand('zoom-out')} title="Alejar">
                <span className="toolbar-icon">−</span>
              </button>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleToolbarCommand('zoom-in')} title="Acercar">
                <span className="toolbar-icon">+</span>
              </button>
            </div>
          )}
          <div className="action-group compact report-group report-group-right">
            <button
              type="button"
              className="action-btn"
              onClick={handleOpenLinkedJsonFile}
              disabled={!resolvedLinkedJsonSource?.driveUrl}
              title={resolvedLinkedJsonSource?.driveUrl ? 'Abrir JSON vinculado en nueva pestaña' : 'No hay URL disponible'}
            >
              <Link2 />
              Abrir JSON
            </button>
            <button type="button" className="action-btn" onClick={handleOpenResetTemplateModal} title="Restablecer planilla en blanco">
              <RotateCcw />
              Reiniciar planilla
            </button>
            <button type="button" className="action-btn" onClick={handlePrint}>
              <Printer />
              Imprimir
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={handleUpdateLinkedJson}
              disabled={isSavingLinkedJson || !hasLinkedJsonSource}
              title={linkedJsonSource?.fileName
                ? `Guardar cambios en ${linkedJsonSource.fileName}`
                : 'Guardar cambios del JSON abierto desde agenda/historial'}
            >
              <Save />
              {isSavingLinkedJson ? 'Guardando JSON...' : 'Guardar JSON'}
            </button>
            <button type="button" className="action-btn primary" onClick={handleCreatePatientWithPdf}>
              <Save />
              Crear & Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="workspace">
          <div className="sheet-shell">
            <div
              id="sheet"
              className={`sheet edit-mode`}
              style={{ '--sheet-zoom': sheetZoom } as React.CSSProperties}
            >
              {logoUrls.left && (
                <img
                  id="logoLeft"
                  src={logoUrls.left}
                  crossOrigin="anonymous"
                  className="print:block"
                  style={{ ...reportLogoStyle, left: '1.5mm' }}
                  alt="Logo Left"
                />
              )}
              {logoUrls.right && (
                <img
                  id="logoRight"
                  src={logoUrls.right}
                  crossOrigin="anonymous"
                  className="print:block"
                  style={{ ...reportLogoStyle, right: '1.5mm' }}
                  alt="Logo Right"
                />
              )}
              <div
                className="title"
                contentEditable={record.templateId === '5' || activeEditTarget?.type === 'record-title'}
                suppressContentEditableWarning
                onDoubleClick={() => handleActivateEdit({ type: 'record-title' })}
                onBlur={e => setRecord({ ...record, title: e.currentTarget.innerText })}
              >
                {record.title}
              </div>
              <PatientInfo
                isEditing
                isGlobalStructureEditing={isGlobalStructureEditing}
                activeEditTarget={
                  activeEditTarget?.type === 'patient-section-title' || activeEditTarget?.type === 'patient-field-label'
                    ? activeEditTarget
                    : null
                }
                onActivateEdit={(target) => handleActivateEdit(target as typeof activeEditTarget)}
                patientFields={record.patientFields}
                onPatientFieldChange={handlePatientFieldChange}
                onPatientLabelChange={handlePatientLabelChange}
                onRemovePatientField={handleRemovePatientField}
              />
              <div id="sectionsContainer">
                {record.sections.map((section, index) => (
                  <ClinicalSection
                    key={`${section.title}-${index}`}
                    section={section}
                    index={index}
                    isEditing
                    isAdvancedEditing={isAdvancedEditing}
                    isGlobalStructureEditing={isGlobalStructureEditing}
                    activeEditTarget={
                      activeEditTarget?.type === 'section-title' && activeEditTarget.index === index ? activeEditTarget : null
                    }
                    onActivateEdit={(target) => handleActivateEdit(target as typeof activeEditTarget)}
                    onSectionContentChange={handleSectionContentChange}
                    onSectionTitleChange={handleSectionTitleChange}
                    onRemoveSection={handleRemoveSection}
                    onUpdateSectionMeta={handleUpdateSectionMeta}
                  />
                ))}
              </div>
              <Footer
                medico={record.medico}
                especialidad={record.especialidad}
                onMedicoChange={(value) => setRecord((prev) => ({ ...prev, medico: value }))}
                onEspecialidadChange={(value) => setRecord((prev) => ({ ...prev, especialidad: value }))}
              />
            </div>
          </div>
          {isGlobalStructureEditing && (
            <button onClick={handleAddSection} className="btn compact-btn" type="button">
              Agregar nueva sección
            </button>
          )}
        </div>
      </div>
      {isResetTemplateModalOpen && (
        <div className="confirm-dialog-overlay" role="presentation" onClick={handleCloseResetTemplateModal}>
          <div
            className="confirm-dialog"
            data-tone="warning"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-template-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-dialog-header">
              <div className="confirm-dialog-icon" aria-hidden="true">!</div>
              <div>
                <div className="confirm-dialog-title" id="reset-template-title">Restablecer planilla</div>
                <p className="confirm-dialog-message">
                  Se limpiará el contenido del informe actual y se conservará solo la estructura base de la plantilla.
                </p>
              </div>
            </div>
            <div className="confirm-dialog-actions">
              <button type="button" className="btn" onClick={handleCloseResetTemplateModal}>Cancelar</button>
              <button
                type="button"
                className="btn btn-primary"
                data-tone="warning"
                onClick={handleConfirmResetTemplate}
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportView;
