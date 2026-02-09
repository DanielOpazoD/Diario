import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClinicalNote from '@core/patient/components/ClinicalNote';

vi.mock('@core/patient/components/PendingTasksPanel', () => ({
  default: () => <div data-testid="pending-tasks" />,
}));

describe('ClinicalNote', () => {
  const baseProps = {
    diagnosis: 'Dx',
    clinicalNote: 'Nota',
    pendingTasks: [],
    isListening: false,
    isAnalyzing: false,
    isSummarizing: false,
    onDiagnosisChange: vi.fn(),
    onClinicalNoteChange: vi.fn(),
    onToggleListening: vi.fn(),
    onAnalyze: vi.fn(),
    onSummary: vi.fn(),
    onToggleTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onAddTask: vi.fn(),
    onUpdateTaskNote: vi.fn(),
    onChangeTab: vi.fn(),
    attachmentsCount: 2,
  };

  it('renders tabs and calls onChangeTab', () => {
    render(
      <ClinicalNote
        {...baseProps}
        activeTab="clinical"
      />
    );

    const filesTab = screen.getByRole('tab', { name: /Adjuntos/i });
    fireEvent.click(filesTab);
    expect(baseProps.onChangeTab).toHaveBeenCalledWith('files');

    const clinicalTab = screen.getByRole('tab', { name: /Clí/i });
    fireEvent.click(clinicalTab);
    expect(baseProps.onChangeTab).toHaveBeenCalledWith('clinical');

    const diagnosisInput = screen.getByPlaceholderText('Diagnóóstico principal...');
    fireEvent.change(diagnosisInput, { target: { value: 'Nuevo Dx' } });
    expect(baseProps.onDiagnosisChange).toHaveBeenCalledWith('Nuevo Dx');

    const noteInput = screen.getByPlaceholderText('Escribe la evolución del paciente...');
    fireEvent.change(noteInput, { target: { value: 'Nueva nota' } });
    expect(baseProps.onClinicalNoteChange).toHaveBeenCalledWith('Nueva nota');

    fireEvent.click(screen.getByTitle('Dictar voz'));
    expect(baseProps.onToggleListening).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Generar diagnóstico y tareas'));
    expect(baseProps.onAnalyze).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Resumir nota clínica'));
    expect(baseProps.onSummary).toHaveBeenCalled();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('pending-tasks')).toBeInTheDocument();
  });

  it('renders fallback for attachments when no section provided', () => {
    render(
      <ClinicalNote
        {...baseProps}
        activeTab="files"
        attachmentsSection={undefined}
      />
    );

    expect(screen.getByText('No hay adjuntos disponibles para este paciente.')).toBeInTheDocument();
  });

  it('renders provided attachments section', () => {
    render(
      <ClinicalNote
        {...baseProps}
        activeTab="files"
        attachmentsSection={<div>Adjuntos</div>}
      />
    );

    expect(screen.getAllByText('Adjuntos').length).toBeGreaterThan(1);
  });
});
