import React from 'react';

interface FooterProps {
  medico: string;
  especialidad: string;
  onMedicoChange: (value: string) => void;
  onEspecialidadChange: (value: string) => void;
}

const Footer: React.FC<FooterProps> = ({ medico, especialidad, onMedicoChange, onEspecialidadChange }) => {
  return (
    <div className="sec report-footer" style={{ marginTop: '4px' }}>
      <div className="grid-2 report-footer-grid">
        <div className="row report-footer-row">
          <div className="lbl">Médico</div>
          <input
            className="inp"
            id="medico"
            value={medico}
            onChange={e => onMedicoChange(e.target.value)}
          />
        </div>
        <div className="row report-footer-row">
          <div className="lbl">Especialidad</div>
          <input
            className="inp"
            id="esp"
            value={especialidad}
            onChange={e => onEspecialidadChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default Footer;
