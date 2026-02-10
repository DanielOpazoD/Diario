import React from 'react';
import type { ReportRecord, ReportSection } from '@domain/report';
import { logoUrls } from '@domain/report/institutionConfig';
import PatientInfo from '@features/reports/components/PatientInfo';
import ClinicalSection from '@features/reports/components/ClinicalSection';
import Footer from '@features/reports/components/Footer';
import type { ReportEditTarget } from '@features/reports/hooks/useReportEditorState';
import { reportLogoStyle } from '@features/reports/utils/reportJsonImport';

type PatientInfoTarget = { type: 'patient-section-title' | 'patient-field-label'; index?: number };

type ReportSheetProps = {
  record: ReportRecord;
  sheetZoom: number;
  activeEditTarget: ReportEditTarget;
  isAdvancedEditing: boolean;
  isGlobalStructureEditing: boolean;
  onActivateEdit: (target: Exclude<ReportEditTarget, null>) => void;
  onRecordTitleChange: (title: string) => void;
  onPatientInfoActivateEdit: (target: PatientInfoTarget) => void;
  onPatientFieldChange: (index: number, value: string) => void;
  onPatientLabelChange: (index: number, label: string) => void;
  onRemovePatientField: (index: number) => void;
  onSectionContentChange: (index: number, content: string) => void;
  onSectionTitleChange: (index: number, title: string) => void;
  onRemoveSection: (index: number) => void;
  onUpdateSectionMeta: (index: number, meta: Partial<ReportSection>) => void;
  onMedicoChange: (value: string) => void;
  onEspecialidadChange: (value: string) => void;
};

const ReportSheet: React.FC<ReportSheetProps> = ({
  record,
  sheetZoom,
  activeEditTarget,
  isAdvancedEditing,
  isGlobalStructureEditing,
  onActivateEdit,
  onRecordTitleChange,
  onPatientInfoActivateEdit,
  onPatientFieldChange,
  onPatientLabelChange,
  onRemovePatientField,
  onSectionContentChange,
  onSectionTitleChange,
  onRemoveSection,
  onUpdateSectionMeta,
  onMedicoChange,
  onEspecialidadChange,
}) => {
  return (
    <div
      id="sheet"
      className="sheet edit-mode"
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
        onDoubleClick={() => onActivateEdit({ type: 'record-title' })}
        onBlur={(event) => onRecordTitleChange(event.currentTarget.innerText)}
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
        onActivateEdit={onPatientInfoActivateEdit}
        patientFields={record.patientFields}
        onPatientFieldChange={onPatientFieldChange}
        onPatientLabelChange={onPatientLabelChange}
        onRemovePatientField={onRemovePatientField}
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
              activeEditTarget?.type === 'section-title' && activeEditTarget.index === index
                ? activeEditTarget
                : null
            }
            onActivateEdit={onActivateEdit}
            onSectionContentChange={onSectionContentChange}
            onSectionTitleChange={onSectionTitleChange}
            onRemoveSection={onRemoveSection}
            onUpdateSectionMeta={onUpdateSectionMeta}
          />
        ))}
      </div>

      <Footer
        medico={record.medico}
        especialidad={record.especialidad}
        onMedicoChange={onMedicoChange}
        onEspecialidadChange={onEspecialidadChange}
      />
    </div>
  );
};

export default ReportSheet;
