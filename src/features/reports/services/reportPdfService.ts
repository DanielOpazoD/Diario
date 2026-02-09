import jsPDF from 'jspdf';
import { sanitizeRichText } from '@shared/utils/richTextSanitization';
import { REPORT_TEMPLATES } from '@domain/report/rules';
import { formatDateDMY } from '@domain/report';
import type { ReportRecord } from '@domain/report/entities';
import { generatePrintStyledPdfBlob } from '@features/reports/services/reportPrintPdfService';
import type { ReportPrintOptions } from '@features/reports/services/reportPrintPdfService';

const generateStructuredReportPdfBlob = async (record: ReportRecord): Promise<Blob> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  // Keep PDF content as selectable text. Avoid canvas-based snapshots because
  // they produce large, image-only files that are hard to search/copy.

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
      container.innerHTML = sanitizeRichText(value);
      container.querySelectorAll('li').forEach(li => {
        const parent = li.parentElement;
        const isOrdered = parent?.tagName === 'OL';
        const index = parent ? Array.from(parent.children).indexOf(li) + 1 : 0;
        const prefix = isOrdered ? `${index}. ` : '• ';
        const text = (li.textContent || '').trim();
        if (text.startsWith(prefix.trim())) return;
        li.insertAdjacentText('afterbegin', prefix);
      });
      return container.innerText || container.textContent || '';
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

export const generateReportPdfBlob = async (
  record: ReportRecord,
  printOptions?: ReportPrintOptions
): Promise<Blob> => {
  const printStyledBlob = await generatePrintStyledPdfBlob(printOptions);
  if (printStyledBlob) {
    return printStyledBlob;
  }

  return generateStructuredReportPdfBlob(record);
};
