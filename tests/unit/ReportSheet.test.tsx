import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReportSheet from '@features/reports/components/ReportSheet';
import type { ReportRecord } from '@domain/report';

const buildRecord = (): ReportRecord => ({
  version: '1',
  templateId: '2',
  title: 'Evolución médica (17-02-2026)',
  patientFields: [
    { id: 'nombre', label: 'Nombre', value: 'Daniel Opazo', type: 'text' },
    { id: 'rut', label: 'RUT', value: '17.752.753-K', type: 'text' },
  ],
  sections: [
    { title: 'Diagnósticos', content: 'Insuficiencia cardiaca' },
  ],
  medico: 'Dra. Prueba',
  especialidad: 'Medicina Interna',
});

describe('ReportSheet', () => {
  it('renders report title, sections and footer fields', () => {
    const record = buildRecord();

    const { container } = render(
      <ReportSheet
        record={record}
        sheetZoom={1}
        activeEditTarget={null}
        isAdvancedEditing={false}
        isGlobalStructureEditing={false}
        onActivateEdit={vi.fn()}
        onRecordTitleChange={vi.fn()}
        onPatientInfoActivateEdit={vi.fn()}
        onPatientFieldChange={vi.fn()}
        onPatientLabelChange={vi.fn()}
        onRemovePatientField={vi.fn()}
        onSectionContentChange={vi.fn()}
        onSectionTitleChange={vi.fn()}
        onRemoveSection={vi.fn()}
        onUpdateSectionMeta={vi.fn()}
        onMedicoChange={vi.fn()}
        onEspecialidadChange={vi.fn()}
      />
    );

    expect(screen.getByText('Evolución médica (17-02-2026)')).toBeInTheDocument();
    expect(screen.getByText('Diagnósticos')).toBeInTheDocument();
    expect(container.querySelector('#sheet')).not.toBeNull();
    expect(container.querySelector('#medico')).not.toBeNull();
    expect(container.querySelector('#esp')).not.toBeNull();
  });
});
