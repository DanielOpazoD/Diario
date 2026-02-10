import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { calculateAge, normalizeBirthDateInput } from '@shared/utils/dateUtils';
import { REPORT_TEMPLATES, formatDateDMY } from '@domain/report';
import type { ReportRecord, ReportSection } from '@domain/report';
import { useReportToolbarCommands } from '@features/reports/hooks/useReportToolbarCommands';

export type ReportEditTarget =
  | { type: 'record-title' }
  | { type: 'patient-section-title' }
  | { type: 'patient-field-label'; index: number }
  | { type: 'section-title'; index: number }
  | null;

type NonNullEditTarget = Exclude<ReportEditTarget, null>;

type UseReportEditorStateParams = {
  record: ReportRecord;
  setRecord: Dispatch<SetStateAction<ReportRecord>>;
};

export const useReportEditorState = ({ record, setRecord }: UseReportEditorStateParams) => {
  const [activeEditTarget, setActiveEditTarget] = useState<ReportEditTarget>(null);
  const [isAdvancedEditing, setIsAdvancedEditing] = useState(false);
  const [isGlobalStructureEditing, setIsGlobalStructureEditing] = useState(false);
  const { sheetZoom, handleToolbarCommand } = useReportToolbarCommands();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('advanced-editing-active', isAdvancedEditing);
    return () => {
      document.body.classList.remove('advanced-editing-active');
    };
  }, [isAdvancedEditing]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
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
  }, [record.patientFields, setRecord]);

  const handleActivateEdit = useCallback((target: NonNullEditTarget) => {
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
  }, [setRecord]);

  const handlePatientLabelChange = useCallback((index: number, label: string) => {
    setRecord((prev) => {
      const nextFields = [...prev.patientFields];
      nextFields[index] = { ...nextFields[index], label };
      return { ...prev, patientFields: nextFields };
    });
  }, [setRecord]);

  const handleRemovePatientField = useCallback((index: number) => {
    setRecord((prev) => ({
      ...prev,
      patientFields: prev.patientFields.filter((_, idx) => idx !== index),
    }));
  }, [setRecord]);

  const handleSectionContentChange = useCallback((index: number, content: string) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], content };
      return { ...prev, sections: nextSections };
    });
  }, [setRecord]);

  const handleSectionTitleChange = useCallback((index: number, title: string) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], title };
      return { ...prev, sections: nextSections };
    });
  }, [setRecord]);

  const handleRemoveSection = useCallback((index: number) => {
    setRecord((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  }, [setRecord]);

  const handleUpdateSectionMeta = useCallback((index: number, meta: Partial<ReportSection>) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], ...meta };
      return { ...prev, sections: nextSections };
    });
  }, [setRecord]);

  const handleAddSection = useCallback(() => {
    setRecord((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: 'Sección personalizada', content: '' }],
    }));
  }, [setRecord]);

  const handleAddClinicalUpdateSection = useCallback(() => {
    setRecord((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { title: 'Actualización clínica', content: '', kind: 'clinical-update', updateDate: '', updateTime: '' },
      ],
    }));
  }, [setRecord]);

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
  }, [setRecord]);

  return {
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
  };
};
