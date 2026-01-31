import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { FileDown, Plus, Printer, Save, SlidersHorizontal, PencilRuler } from 'lucide-react';
import { format } from 'date-fns';
import { useAppActions } from '@core/app/state/useAppActions';
import { useAppState } from '@core/app/state/useAppState';
import { PatientCreateInput } from '@shared/types';
import { calculateAge, normalizeBirthDateInput } from '@shared/utils/dateUtils';
import { savePatientRecord } from '@use-cases/patient/save';
import { uploadFileToFirebase } from '@services/firebaseStorageService';
import { loadReportDraft, saveReportDraft } from '@services/reportDraftService';
import {
  DEFAULT_REPORT_PATIENT_FIELDS,
  DEFAULT_REPORT_SECTIONS,
  DEFAULT_REPORT_TEMPLATE_ID,
  REPORT_TEMPLATES,
} from '@domain/report/rules';
import type { ReportRecord, ReportSection } from '@domain/report/entities';
import PatientInfo from '@features/reports/components/PatientInfo';
import ClinicalSection from '@features/reports/components/ClinicalSection';
import Footer from '@features/reports/components/Footer';
import reportStyles from '@features/reports/reportStyles.css?raw';
import { logoUrls } from '@domain/report/institutionConfig';

const createTemplateBaseline = (templateId: string): ReportRecord => {
  const selectedTemplateId = REPORT_TEMPLATES[templateId] ? templateId : DEFAULT_REPORT_TEMPLATE_ID;
  const template = REPORT_TEMPLATES[selectedTemplateId];

  return {
    version: '1.0.0',
    templateId: selectedTemplateId,
    title: template?.title || 'Registro clínico',
    patientFields: JSON.parse(JSON.stringify(DEFAULT_REPORT_PATIENT_FIELDS)),
    sections: JSON.parse(JSON.stringify(DEFAULT_REPORT_SECTIONS)),
    medico: '',
    especialidad: '',
  };
};

const formatDateDMY = (value?: string) => {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
};

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[\s\/_\\]+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const findSectionContent = (sections: ReportRecord['sections'], keywords: string[]) => {
  const normalized = keywords.map((keyword) => keyword.toLowerCase());
  const match = sections.find((section) =>
    normalized.some((keyword) => section.title.toLowerCase().includes(keyword))
  );
  return match?.content?.trim() || '';
};

const buildClinicalNote = (sections: ReportRecord['sections']) => {
  const antecedentes = findSectionContent(sections, ['antecedente']);
  const historia = findSectionContent(sections, ['historia', 'evoluci']);
  const examen = findSectionContent(sections, ['examen']);
  const plan = findSectionContent(sections, ['plan']);

  return [
    antecedentes ? `Antecedentes:\n${antecedentes}` : '',
    historia ? `Historia y evolución clínica:\n${historia}` : '',
    examen ? `Exámenes complementarios:\n${examen}` : '',
    plan ? `Plan:\n${plan}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
};

const MedicalReportView: React.FC = () => {
  const { addPatient, updatePatient, addToast } = useAppActions();
  const { patientTypes, user } = useAppState();
  const [record, setRecord] = useState<ReportRecord>(() => createTemplateBaseline(DEFAULT_REPORT_TEMPLATE_ID));
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
  const draftIdRef = useRef<string>('');
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const existingId = localStorage.getItem('medidiario_report_draft_id');
    const draftId = existingId || crypto.randomUUID();
    draftIdRef.current = draftId;
    if (!existingId) {
      localStorage.setItem('medidiario_report_draft_id', draftId);
    }
  }, []);

  useEffect(() => {
    const localDraft = localStorage.getItem('medidiario_report_draft');
    if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft) as { record: ReportRecord; updatedAt?: number };
        if (parsed?.record) {
          setRecord(parsed.record);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const draftId = draftIdRef.current;
    if (!draftId || !user) return;
    let cancelled = false;

    (async () => {
      const remote = await loadReportDraft(draftId);
      if (!remote || cancelled) return;
      const localDraft = localStorage.getItem('medidiario_report_draft');
      let localUpdatedAt = 0;
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft) as { updatedAt?: number };
          localUpdatedAt = parsed?.updatedAt || 0;
        } catch {
          localUpdatedAt = 0;
        }
      }
      if (remote.updatedAt > localUpdatedAt) {
        setRecord(remote.record);
        localStorage.setItem('medidiario_report_draft', JSON.stringify({ record: remote.record, updatedAt: remote.updatedAt }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!draftIdRef.current) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      const payload = { record, updatedAt: Date.now() };
      localStorage.setItem('medidiario_report_draft', JSON.stringify(payload));
      if (user) {
        saveReportDraft(draftIdRef.current, record);
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [record, user]);

  const defaultTypeId = useMemo(() => patientTypes[0]?.id || 'policlinico', [patientTypes]);
  const [selectedTypeId, setSelectedTypeId] = useState(defaultTypeId);

  useEffect(() => {
    if (!selectedTypeId && patientTypes.length > 0) {
      setSelectedTypeId(patientTypes[0].id);
    }
  }, [patientTypes, selectedTypeId]);

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

  const handleActivateEdit = (target: typeof activeEditTarget) => {
    setActiveEditTarget(target);
  };

  const handlePatientFieldChange = (index: number, value: string) => {
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
  };

  const handlePatientLabelChange = (index: number, label: string) => {
    setRecord((prev) => {
      const nextFields = [...prev.patientFields];
      nextFields[index] = { ...nextFields[index], label };
      return { ...prev, patientFields: nextFields };
    });
  };

  const handleRemovePatientField = (index: number) => {
    setRecord((prev) => ({
      ...prev,
      patientFields: prev.patientFields.filter((_, idx) => idx !== index),
    }));
  };

  const handleSectionContentChange = (index: number, content: string) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], content };
      return { ...prev, sections: nextSections };
    });
  };

  const handleSectionTitleChange = (index: number, title: string) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], title };
      return { ...prev, sections: nextSections };
    });
  };

  const handleRemoveSection = (index: number) => {
    setRecord((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateSectionMeta = (index: number, meta: Partial<ReportSection>) => {
    setRecord((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], ...meta };
      return { ...prev, sections: nextSections };
    });
  };

  const handleAddSection = () => {
    setRecord((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: 'Sección personalizada', content: '' }],
    }));
  };

  const handleAddClinicalUpdateSection = () => {
    setRecord((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { title: 'Actualización clínica', content: '', kind: 'clinical-update', updateDate: '', updateTime: '' },
      ],
    }));
  };

  const handleTemplateChange = (templateId: string) => {
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
  };

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

  const getFieldValue = useCallback(
    (fieldId: string) => record.patientFields.find((field) => field.id === fieldId)?.value?.trim() || '',
    [record.patientFields]
  );

  const buildPatientPayload = () => {
    const name = getFieldValue('nombre');
    const rut = getFieldValue('rut');
    const birthDate = normalizeBirthDateInput(getFieldValue('fecnac'));
    const gender = '';

    if (!name || !rut) {
      addToast('error', 'Ingresa nombre completo y RUT para crear el paciente.');
      return null;
    }

    const diagnosis = findSectionContent(record.sections, ['diagnost']);
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
  };

  const handleCreatePatient = () => {
    const payload = buildPatientPayload();
    if (!payload) return;

    const result = savePatientRecord(payload.patientData, null);
    addPatient(result.patient);
    addToast('success', 'Paciente creado desde informe.');
  };

  const handleCreatePatientWithPdf = async () => {
    const payload = buildPatientPayload();
    if (!payload) return;

    const result = savePatientRecord(payload.patientData, null);
    addPatient(result.patient);

    try {
      const blob = await generatePdfAsBlob();
      const patientName = payload.patientData.name || 'paciente';
      const fileNameBase = sanitizeFileName(`${record.title || 'informe'}-${patientName}`) || 'informe';
      const file = new File([blob], `${fileNameBase}.pdf`, { type: 'application/pdf' });
      const attachedFile = await uploadFileToFirebase(file, result.patient.id);
      updatePatient({ ...result.patient, attachedFiles: [attachedFile] });
      addToast('success', 'Paciente creado y PDF adjuntado.');
    } catch (error) {
      addToast('error', 'Paciente creado, pero el PDF no se pudo adjuntar.');
    }
  };

  const handleToolbarCommand = (command: string) => {
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
  };

  const generatePdfAsBlob = async (): Promise<Blob> => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const sheet = document.getElementById('sheet');
    if (sheet) {
      const prevTransform = (sheet as HTMLElement).style.transform;
      const prevZoom = (sheet as HTMLElement).style.getPropertyValue('--sheet-zoom');
      (sheet as HTMLElement).style.transform = 'none';
      (sheet as HTMLElement).style.setProperty('--sheet-zoom', '1');

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(sheet as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const imageWidth = maxWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const scale = Math.min(1, maxHeight / imageHeight);
      const renderWidth = imageWidth * scale;
      const renderHeight = imageHeight * scale;
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      const imageData = canvas.toDataURL('image/png');
      pdf.addImage(imageData, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

      (sheet as HTMLElement).style.transform = prevTransform;
      (sheet as HTMLElement).style.setProperty('--sheet-zoom', prevZoom);
      return pdf.output('blob');
    }
    const marginX = 16;
    const marginY = 18;
    const lineHeight = 6;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginX * 2;
    let cursorY = marginY;

    const ensureSpace = (height: number) => {
      if (cursorY + height > pageHeight - marginY) {
        pdf.addPage();
        cursorY = marginY;
      }
    };

    const addTitle = (text: string) => {
      if (!text.trim()) return;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      ensureSpace(lineHeight * 2);
      pdf.text(text, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += lineHeight + 3;
    };

    const addSectionTitle = (text: string) => {
      if (!text.trim()) return;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      ensureSpace(lineHeight * 1.2);
      pdf.text(text.trim(), marginX, cursorY);
      cursorY += lineHeight;
    };

    const addLabeledValue = (label: string, value: string | undefined) => {
      const labelText = `${label}:`;
      const displayValue = value && value.trim() ? value : '—';
      const maxLabelWidth = contentWidth * 0.45;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const rawLabelWidth = pdf.getTextWidth(labelText);
      const labelWidth = Math.min(rawLabelWidth, maxLabelWidth);
      const hasInlineSpace = labelWidth + 4 < contentWidth;

      if (!hasInlineSpace) {
        const labelLines = pdf.splitTextToSize(labelText, contentWidth);
        const valueLines = pdf.splitTextToSize(displayValue, contentWidth);
        const totalHeight = lineHeight * (labelLines.length + valueLines.length);
        ensureSpace(totalHeight + 2);
        labelLines.forEach((line: string) => {
          pdf.text(line, marginX, cursorY);
          cursorY += lineHeight;
        });
        pdf.setFont('helvetica', 'normal');
        valueLines.forEach((line: string) => {
          pdf.text(line, marginX, cursorY);
          cursorY += lineHeight;
        });
        cursorY += 1.5;
        return;
      }

      const valueWidth = Math.max(contentWidth - labelWidth - 4, contentWidth * 0.35);
      const valueLines = pdf.splitTextToSize(displayValue, valueWidth);
      const blockHeight = lineHeight * valueLines.length;
      ensureSpace(blockHeight + 2);
      pdf.text(labelText, marginX, cursorY);
      pdf.setFont('helvetica', 'normal');
      valueLines.forEach((line: string, index: number) => {
        pdf.text(line, marginX + labelWidth + 4, cursorY + index * lineHeight);
      });
      cursorY += blockHeight;
      cursorY += 1.5;
    };

    const addParagraphs = (content: string) => {
      const htmlToPlainText = (value: string) => {
        if (!value) return '';
        if (typeof window === 'undefined') return value;
        const container = document.createElement('div');
        container.innerHTML = value;
        container.querySelectorAll('li').forEach(li => {
          const parent = li.parentElement;
          const isOrdered = parent?.tagName === 'OL';
          const index = parent ? Array.from(parent.children).indexOf(li) + 1 : 0;
          const prefix = isOrdered ? `${index}. ` : '• ';
          const text = li.innerText.trim();
          if (text.startsWith(prefix.trim())) return;
          li.insertAdjacentText('afterbegin', prefix);
        });
        return container.innerText;
      };

      const plainText = htmlToPlainText(content);
      const paragraphs = plainText
        .split(/\r?\n+/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      if (paragraphs.length === 0) {
        ensureSpace(lineHeight * 1.2);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Sin contenido registrado.', marginX, cursorY);
        pdf.setFont('helvetica', 'normal');
        cursorY += lineHeight + 1.5;
        return;
      }

      paragraphs.forEach((paragraph: string, index: number) => {
        const lines = pdf.splitTextToSize(paragraph, contentWidth);
        ensureSpace(lineHeight * lines.length + 1);
        lines.forEach((line: string) => {
          pdf.text(line, marginX, cursorY);
          cursorY += lineHeight;
        });
        if (index < paragraphs.length - 1) {
          cursorY += 1.5;
        }
      });
      cursorY += 2;
    };

    const templateTitle = record.title?.trim() || REPORT_TEMPLATES[record.templateId]?.title || 'Registro Clínico';
    addTitle(templateTitle);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    addSectionTitle('Información del Paciente');
    cursorY += 1;
    record.patientFields.forEach(field => {
      addLabeledValue(field.label, field.value);
    });
    cursorY += 2;

    record.sections.forEach(section => {
      addSectionTitle(section.title);
      if (section.kind === 'clinical-update') {
        if (section.updateDate) {
          addLabeledValue('Fecha', formatDateDMY(section.updateDate));
        }
        if (section.updateTime) {
          addLabeledValue('Hora', section.updateTime);
        }
      }
      addParagraphs(section.content);
    });

    if (record.medico || record.especialidad) {
      addSectionTitle('Profesional Responsable');
      if (record.medico) addLabeledValue('Médico', record.medico);
      if (record.especialidad) addLabeledValue('Especialidad', record.especialidad);
    }

    return pdf.output('blob');
  };

  const handleDownloadPdf = async () => {
    const blob = await generatePdfAsBlob();
    const patientName = getFieldValue('nombre');
    const baseName = sanitizeFileName(`${record.title || 'informe'}-${patientName || 'paciente'}`) || 'informe';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const templateOptions = Object.values(REPORT_TEMPLATES);

  return (
    <div className="clinical-report-root">
      <div className="topbar modern-topbar">
        <div className="topbar-main modern-topbar-main single-row">
          <div className="template-row compact">
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
            <span className="status-pill">
              <span className="status-dot" data-state="saved" />
              <span>Edición activa</span>
            </span>
          </div>

          <div className="action-group compact">
            <button type="button" className="action-btn icon" onClick={() => setIsAdvancedEditing((prev) => !prev)} title="Edición avanzada">
              <PencilRuler />
            </button>
            <button type="button" className="action-btn icon" onClick={() => setIsGlobalStructureEditing((prev) => !prev)} title="Editar estructura">
              <SlidersHorizontal />
            </button>
            {isAdvancedEditing && (
              <div className="editor-toolbar" role="toolbar" aria-label="Herramientas de edición avanzada">
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
            <button type="button" className="action-btn" onClick={handleDownloadPdf}>
              <FileDown />
              PDF
            </button>
            <button type="button" className="action-btn" onClick={handlePrint}>
              <Printer />
              Imprimir
            </button>
            <button type="button" className="action-btn" onClick={handleCreatePatient}>
              <Save />
              Crear paciente
            </button>
            <button type="button" className="action-btn primary" onClick={handleCreatePatientWithPdf}>
              <Save />
              Crear + PDF
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
                <img id="logoLeft" src={logoUrls.left} crossOrigin="anonymous" className="absolute top-2 left-2 w-12 h-auto opacity-60 print:block" alt="Logo Left" />
              )}
              {logoUrls.right && (
                <img id="logoRight" src={logoUrls.right} crossOrigin="anonymous" className="absolute top-2 right-2 w-12 h-auto opacity-60 print:block" alt="Logo Right" />
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
    </div>
  );
};

export default MedicalReportView;
