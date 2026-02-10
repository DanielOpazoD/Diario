import React from 'react';
import ReportTopbar from '@features/reports/components/ReportTopbar';
import ReportSheet from '@features/reports/components/ReportSheet';
import ReportResetTemplateModal from '@features/reports/components/ReportResetTemplateModal';
import {
  createFallbackReportHost,
  ReportHostContext,
  useDefaultReportHostContext,
} from '@features/reports/host/reportHost';
import { useMedicalReportController } from '@features/reports/hooks/useMedicalReportController';
import { useReportStyleMount } from '@features/reports/hooks/useReportStyleMount';

const FALLBACK_REPORT_HOST = createFallbackReportHost();

type MedicalReportViewProps = {
  host?: ReportHostContext;
};

export const MedicalReportViewContent: React.FC<MedicalReportViewProps> = ({ host }) => {
  const resolvedHost = host || FALLBACK_REPORT_HOST;
  useReportStyleMount();
  const controller = useMedicalReportController(resolvedHost);

  return (
    <div className="clinical-report-root report-focus-mode">
      <ReportTopbar
        patientName={controller.topbar.patientName}
        patientRut={controller.topbar.patientRut}
        reportDateDisplay={controller.topbar.reportDateDisplay}
        templateId={controller.topbar.templateId}
        templateOptions={controller.topbar.templateOptions}
        isAdvancedEditing={controller.topbar.isAdvancedEditing}
        isSavingLinkedJson={controller.topbar.isSavingLinkedJson}
        hasLinkedJsonSource={controller.topbar.hasLinkedJsonSource}
        linkedJsonFileName={controller.topbar.linkedJsonFileName}
        canOpenLinkedJsonFile={controller.topbar.canOpenLinkedJsonFile}
        onTemplateChange={controller.topbar.onTemplateChange}
        onAddClinicalUpdateSection={controller.topbar.onAddClinicalUpdateSection}
        onToggleAdvancedEditing={controller.topbar.onToggleAdvancedEditing}
        onToggleStructureEditing={controller.topbar.onToggleStructureEditing}
        onToolbarCommand={controller.topbar.onToolbarCommand}
        onOpenLinkedJsonFile={controller.topbar.onOpenLinkedJsonFile}
        onOpenResetTemplateModal={controller.topbar.onOpenResetTemplateModal}
        onPrint={controller.topbar.onPrint}
        onUpdateLinkedJson={controller.topbar.onUpdateLinkedJson}
        onCreatePatientWithPdf={controller.topbar.onCreatePatientWithPdf}
      />

      <div className="wrap">
        <div className="workspace">
          <div className="sheet-shell">
            <ReportSheet
              record={controller.record}
              sheetZoom={controller.sheet.sheetZoom}
              activeEditTarget={controller.sheet.activeEditTarget}
              isAdvancedEditing={controller.sheet.isAdvancedEditing}
              isGlobalStructureEditing={controller.sheet.isGlobalStructureEditing}
              onActivateEdit={controller.sheet.onActivateEdit}
              onRecordTitleChange={controller.sheet.onRecordTitleChange}
              onPatientInfoActivateEdit={controller.sheet.onPatientInfoActivateEdit}
              onPatientFieldChange={controller.sheet.onPatientFieldChange}
              onPatientLabelChange={controller.sheet.onPatientLabelChange}
              onRemovePatientField={controller.sheet.onRemovePatientField}
              onSectionContentChange={controller.sheet.onSectionContentChange}
              onSectionTitleChange={controller.sheet.onSectionTitleChange}
              onRemoveSection={controller.sheet.onRemoveSection}
              onUpdateSectionMeta={controller.sheet.onUpdateSectionMeta}
              onMedicoChange={controller.sheet.onMedicoChange}
              onEspecialidadChange={controller.sheet.onEspecialidadChange}
            />
          </div>
          {controller.isGlobalStructureEditing && (
            <button onClick={controller.onAddSection} className="btn compact-btn" type="button">
              Agregar nueva sección
            </button>
          )}
        </div>
      </div>
      <ReportResetTemplateModal
        isOpen={controller.isResetTemplateModalOpen}
        onCancel={controller.onCloseResetTemplateModal}
        onConfirm={controller.onConfirmResetTemplate}
      />
    </div>
  );
};

const MedicalReportView: React.FC = () => {
  const host = useDefaultReportHostContext();
  return <MedicalReportViewContent host={host} />;
};

export default MedicalReportView;
