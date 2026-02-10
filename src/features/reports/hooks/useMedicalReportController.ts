import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_REPORT_TEMPLATE_ID,
  REPORT_TEMPLATES,
  createTemplateBaseline,
} from '@domain/report';
import type { ReportRecord } from '@domain/report';
import { useReportDraft } from '@features/reports/hooks/useReportDraft';
import { useLinkedJsonImport } from '@features/reports/hooks/useLinkedJsonImport';
import { useReportPersistenceActions } from '@features/reports/hooks/useReportPersistenceActions';
import { useReportTopbarContext } from '@features/reports/hooks/useReportTopbarContext';
import { useReportEditorState, type ReportEditTarget } from '@features/reports/hooks/useReportEditorState';
import { useReportHeaderViewModel } from '@features/reports/hooks/useReportHeaderViewModel';
import { generateReportPdfBlob } from '@features/reports/services/reportPdfService';
import type { ReportHostContext } from '@features/reports/host/reportHost';
import { buildReportPatientPayload } from '@use-cases/reportPatient';
import {
  emitReportJsonConsoleError,
  isCompatibleJsonAttachment,
} from '@features/reports/utils/reportJsonImport';

const createTemplate = (templateId: string): ReportRecord => createTemplateBaseline(templateId);

type UseMedicalReportControllerResult = {
  record: ReportRecord;
  topbar: {
    patientName: string;
    patientRut: string;
    reportDateDisplay: string;
    templateId: string;
    templateOptions: Array<{ id: string; name: string; title: string }>;
    isAdvancedEditing: boolean;
    isSavingLinkedJson: boolean;
    hasLinkedJsonSource: boolean;
    linkedJsonFileName?: string;
    canOpenLinkedJsonFile: boolean;
    onTemplateChange: (templateId: string) => void;
    onAddClinicalUpdateSection: () => void;
    onToggleAdvancedEditing: () => void;
    onToggleStructureEditing: () => void;
    onToolbarCommand: (command: string) => void;
    onOpenLinkedJsonFile: () => void;
    onOpenResetTemplateModal: () => void;
    onPrint: () => void;
    onUpdateLinkedJson: () => Promise<void>;
    onCreatePatientWithPdf: () => Promise<void>;
  };
  sheet: {
    sheetZoom: number;
    activeEditTarget: ReportEditTarget;
    isAdvancedEditing: boolean;
    isGlobalStructureEditing: boolean;
    onActivateEdit: (target: Exclude<ReportEditTarget, null>) => void;
    onRecordTitleChange: (title: string) => void;
    onPatientInfoActivateEdit: (target: { type: 'patient-section-title' | 'patient-field-label'; index?: number }) => void;
    onPatientFieldChange: (index: number, value: string) => void;
    onPatientLabelChange: (index: number, label: string) => void;
    onRemovePatientField: (index: number) => void;
    onSectionContentChange: (index: number, content: string) => void;
    onSectionTitleChange: (index: number, title: string) => void;
    onRemoveSection: (index: number) => void;
    onUpdateSectionMeta: (index: number, meta: Partial<ReportRecord['sections'][number]>) => void;
    onMedicoChange: (medico: string) => void;
    onEspecialidadChange: (especialidad: string) => void;
  };
  isGlobalStructureEditing: boolean;
  onAddSection: () => void;
  isResetTemplateModalOpen: boolean;
  onCloseResetTemplateModal: () => void;
  onConfirmResetTemplate: () => void;
};

export const useMedicalReportController = (host: ReportHostContext): UseMedicalReportControllerResult => {
  const { addPatient, updatePatient, addToast } = host.actions;
  const {
    savePatientRecord,
    downloadPatientFileBlob,
    downloadPatientFileBlobById,
    updatePatientFileById,
    uploadPatientFile,
  } = host.data;
  const {
    getLinkedJsonRaw,
    setLinkedJsonRaw,
    setTopbarContextRaw,
    clearTopbarContext,
  } = host.session;
  const { patientTypes, user, records } = host.state;
  const locationSearch = host.locationSearch;

  const hasLinkedImportParams = useMemo(() => {
    const params = new URLSearchParams(locationSearch);
    return Boolean(params.get('patientId') && params.get('fileId'));
  }, [locationSearch]);

  const { record, setRecord } = useReportDraft(
    user,
    createTemplate(DEFAULT_REPORT_TEMPLATE_ID),
    { skipRemoteLoad: hasLinkedImportParams }
  );
  const {
    activeEditTarget,
    isAdvancedEditing,
    setIsAdvancedEditing,
    isGlobalStructureEditing,
    setIsGlobalStructureEditing,
    sheetZoom,
    handleToolbarCommand,
    handleActivateEdit,
    handlePatientFieldChange,
    handlePatientLabelChange,
    handleRemovePatientField,
    handleSectionContentChange,
    handleSectionTitleChange,
    handleRemoveSection,
    handleUpdateSectionMeta,
    handleAddSection,
    handleAddClinicalUpdateSection,
    handleTemplateChange,
  } = useReportEditorState({ record, setRecord });
  const [isResetTemplateModalOpen, setIsResetTemplateModalOpen] = useState(false);

  const defaultTypeId = useMemo(() => patientTypes[0]?.id || 'policlinico', [patientTypes]);
  const [selectedTypeId, setSelectedTypeId] = useState(defaultTypeId);

  useEffect(() => {
    if (!selectedTypeId && patientTypes.length > 0) {
      setSelectedTypeId(patientTypes[0].id);
    }
  }, [patientTypes, selectedTypeId]);

  const {
    linkedJsonSource,
    setLinkedJsonSource,
    resolveLinkedJsonSource,
  } = useLinkedJsonImport({
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
  });

  const {
    reportPatientName,
    reportPatientRut,
    reportDateDisplay,
    buildDefaultReportFileNameBase,
  } = useReportHeaderViewModel(record);

  const buildPatientPayload = useCallback(() => {
    const payload = buildReportPatientPayload({
      patientFields: record.patientFields,
      sections: record.sections,
      patientTypes,
      selectedTypeId,
    });
    if (!payload) {
      addToast('error', 'Ingresa nombre completo y RUT para crear el paciente.');
      return null;
    }
    return payload;
  }, [addToast, patientTypes, record.patientFields, record.sections, selectedTypeId]);

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
    host.openExternal(source.driveUrl);
  }, [addToast, host, resolvedLinkedJsonSource]);

  const hasLinkedJsonSource = useMemo(() => Boolean(resolvedLinkedJsonSource), [resolvedLinkedJsonSource]);

  useReportTopbarContext({
    patientName: reportPatientName,
    patientRut: reportPatientRut,
    reportDate: reportDateDisplay,
    templateName: REPORT_TEMPLATES[record.templateId]?.name || 'Informe clinico',
    setTopbarContextRaw,
    clearTopbarContext,
    emitReportContextChanged: host.emitReportContextChanged,
  });

  const generatePdfAsBlob = useCallback(async (): Promise<Blob> => generateReportPdfBlob(record), [record]);

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

  const {
    isSavingLinkedJson,
    handleCreatePatientWithPdf,
    handleUpdateLinkedJson,
  } = useReportPersistenceActions({
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
  });

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePatientInfoActivateEdit = useCallback((target: { type: 'patient-section-title' | 'patient-field-label'; index?: number }) => {
    if (target.type === 'patient-field-label' && typeof target.index !== 'number') return;
    handleActivateEdit(target as Exclude<ReportEditTarget, null>);
  }, [handleActivateEdit]);

  const handleRecordTitleChange = useCallback((title: string) => {
    setRecord((prev) => ({ ...prev, title }));
  }, [setRecord]);

  const handleMedicoChange = useCallback((medico: string) => {
    setRecord((prev) => ({ ...prev, medico }));
  }, [setRecord]);

  const handleEspecialidadChange = useCallback((especialidad: string) => {
    setRecord((prev) => ({ ...prev, especialidad }));
  }, [setRecord]);

  const templateOptions = useMemo(() => Object.values(REPORT_TEMPLATES), []);

  return {
    record,
    topbar: {
      patientName: reportPatientName,
      patientRut: reportPatientRut,
      reportDateDisplay,
      templateId: record.templateId,
      templateOptions,
      isAdvancedEditing,
      isSavingLinkedJson,
      hasLinkedJsonSource,
      linkedJsonFileName: linkedJsonSource?.fileName,
      canOpenLinkedJsonFile: Boolean(resolvedLinkedJsonSource?.driveUrl),
      onTemplateChange: handleTemplateChange,
      onAddClinicalUpdateSection: handleAddClinicalUpdateSection,
      onToggleAdvancedEditing: () => setIsAdvancedEditing((prev) => !prev),
      onToggleStructureEditing: () => setIsGlobalStructureEditing((prev) => !prev),
      onToolbarCommand: handleToolbarCommand,
      onOpenLinkedJsonFile: handleOpenLinkedJsonFile,
      onOpenResetTemplateModal: handleOpenResetTemplateModal,
      onPrint: handlePrint,
      onUpdateLinkedJson: handleUpdateLinkedJson,
      onCreatePatientWithPdf: handleCreatePatientWithPdf,
    },
    sheet: {
      sheetZoom,
      activeEditTarget,
      isAdvancedEditing,
      isGlobalStructureEditing,
      onActivateEdit: handleActivateEdit,
      onRecordTitleChange: handleRecordTitleChange,
      onPatientInfoActivateEdit: handlePatientInfoActivateEdit,
      onPatientFieldChange: handlePatientFieldChange,
      onPatientLabelChange: handlePatientLabelChange,
      onRemovePatientField: handleRemovePatientField,
      onSectionContentChange: handleSectionContentChange,
      onSectionTitleChange: handleSectionTitleChange,
      onRemoveSection: handleRemoveSection,
      onUpdateSectionMeta: handleUpdateSectionMeta,
      onMedicoChange: handleMedicoChange,
      onEspecialidadChange: handleEspecialidadChange,
    },
    isGlobalStructureEditing,
    onAddSection: handleAddSection,
    isResetTemplateModalOpen,
    onCloseResetTemplateModal: handleCloseResetTemplateModal,
    onConfirmResetTemplate: handleConfirmResetTemplate,
  };
};
