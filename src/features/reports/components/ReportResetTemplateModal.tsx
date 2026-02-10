import React from 'react';

type ReportResetTemplateModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ReportResetTemplateModal: React.FC<ReportResetTemplateModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" role="presentation" onClick={onCancel}>
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
              Se limpiara el contenido del informe actual y se conservara solo la estructura base de la plantilla.
            </p>
          </div>
        </div>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            data-tone="warning"
            onClick={onConfirm}
          >
            Si, reiniciar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportResetTemplateModal;

