import React from 'react';
import { Plus, Printer, Save, SlidersHorizontal, PencilRuler, CalendarDays, UserRound, Link2, RotateCcw } from 'lucide-react';
import type { ReportTemplate } from '@domain/report';

type ReportTopbarProps = {
  patientName: string;
  patientRut: string;
  reportDateDisplay: string;
  templateId: string;
  templateOptions: ReportTemplate[];
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
  onUpdateLinkedJson: () => void;
  onCreatePatientWithPdf: () => void;
};

const ReportTopbar: React.FC<ReportTopbarProps> = ({
  patientName,
  patientRut,
  reportDateDisplay,
  templateId,
  templateOptions,
  isAdvancedEditing,
  isSavingLinkedJson,
  hasLinkedJsonSource,
  linkedJsonFileName,
  canOpenLinkedJsonFile,
  onTemplateChange,
  onAddClinicalUpdateSection,
  onToggleAdvancedEditing,
  onToggleStructureEditing,
  onToolbarCommand,
  onOpenLinkedJsonFile,
  onOpenResetTemplateModal,
  onPrint,
  onUpdateLinkedJson,
  onCreatePatientWithPdf,
}) => (
  <div className="topbar modern-topbar report-shell-header">
    <div className="report-context-strip">
      <div className="report-context-item">
        <UserRound className="report-context-icon" />
        <div className="report-context-text">
          <span className="report-context-label">Paciente</span>
          <span className="report-context-value">{patientName}</span>
        </div>
      </div>
      <div className="report-context-item">
        <span className="report-context-label">RUT</span>
        <span className="report-context-value">{patientRut}</span>
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
          value={templateId}
          onChange={(event) => onTemplateChange(event.target.value)}
        >
          {templateOptions.map((template) => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
        <button
          type="button"
          className="template-update-btn"
          onClick={onAddClinicalUpdateSection}
          title="Agregar actualización clínica"
        >
          <Plus />
          <span>Act. clínica</span>
        </button>
        <button type="button" className="action-btn icon" onClick={onToggleAdvancedEditing} title="Edición avanzada">
          <PencilRuler />
        </button>
        <button type="button" className="action-btn icon" onClick={onToggleStructureEditing} title="Editar estructura">
          <SlidersHorizontal />
        </button>
      </div>
      {isAdvancedEditing && (
        <div className="editor-toolbar report-editor-toolbar" role="toolbar" aria-label="Herramientas de edición avanzada">
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onToolbarCommand('bold')} title="Negrita">
            <span className="toolbar-icon">B</span>
          </button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onToolbarCommand('italic')} title="Cursiva">
            <span className="toolbar-icon toolbar-italic">I</span>
          </button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onToolbarCommand('underline')} title="Subrayado">
            <span className="toolbar-icon toolbar-underline">S</span>
          </button>
          <span className="toolbar-divider" aria-hidden="true" />
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onToolbarCommand('outdent')} title="Reducir sangría">
            <span className="toolbar-icon">⇤</span>
          </button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onToolbarCommand('indent')} title="Aumentar sangría">
            <span className="toolbar-icon">⇥</span>
          </button>
          <span className="toolbar-divider" aria-hidden="true" />
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onToolbarCommand('zoom-out')} title="Alejar">
            <span className="toolbar-icon">−</span>
          </button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onToolbarCommand('zoom-in')} title="Acercar">
            <span className="toolbar-icon">+</span>
          </button>
        </div>
      )}
      <div className="action-group compact report-group report-group-right">
        <button
          type="button"
          className="action-btn"
          onClick={onOpenLinkedJsonFile}
          disabled={!canOpenLinkedJsonFile}
          title={canOpenLinkedJsonFile ? 'Abrir JSON vinculado en nueva pestaña' : 'No hay URL disponible'}
        >
          <Link2 />
          Abrir JSON
        </button>
        <button type="button" className="action-btn" onClick={onOpenResetTemplateModal} title="Restablecer planilla en blanco">
          <RotateCcw />
          Reiniciar planilla
        </button>
        <button type="button" className="action-btn" onClick={onPrint}>
          <Printer />
          Imprimir
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={onUpdateLinkedJson}
          disabled={isSavingLinkedJson || !hasLinkedJsonSource}
          title={linkedJsonFileName
            ? `Guardar cambios en ${linkedJsonFileName}`
            : 'Guardar cambios del JSON abierto desde agenda/historial'}
        >
          <Save />
          {isSavingLinkedJson ? 'Guardando JSON...' : 'Guardar JSON'}
        </button>
        <button type="button" className="action-btn primary" onClick={onCreatePatientWithPdf}>
          <Save />
          Crear & Guardar
        </button>
      </div>
    </div>
  </div>
);

export default ReportTopbar;
