import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ExecutivePatientRow from '@core/patient/components/ExecutivePatientRow';
import { PatientRecord, PatientTypeConfig } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';

const editorSpy = vi.fn();

vi.mock('@core/patient/components/InlinePatientEditor', () => ({
  default: (props: any) => {
    editorSpy(props);
    return <div data-testid="inline-editor" />;
  },
}));

vi.mock('@core/components/TaskStatusIndicator', () => ({
  default: () => <div data-testid="task-status" />,
}));

describe('ExecutivePatientRow', () => {
  const patientTypes: PatientTypeConfig[] = [
    { id: 'policlinico', label: 'Policlínico', colorClass: 'bg-blue-500' },
  ];

  const createPatient = (overrides: Partial<PatientRecord> = {}): PatientRecord => ({
    id: 'patient-1',
    name: 'Paciente Uno',
    rut: '1-9',
    date: '2025-01-01',
    type: 'Policlínico',
    typeId: 'policlinico',
    diagnosis: 'Dx',
    clinicalNote: '',
    pendingTasks: [],
    attachedFiles: [],
    ...overrides,
  });

  beforeEach(() => {
    useAppStore.setState({
      patientTypes,
      updatePatient: vi.fn(),
    });
    editorSpy.mockClear();
  });

  it('opens demographics editor when clicking patient name', async () => {
    const patient = createPatient();
    render(
      <ExecutivePatientRow
        patient={patient}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        addToast={vi.fn()}
        selectedDate="2025-01-01"
      />
    );

    const nameButton = screen.getByRole('button', { name: /Paciente Uno/i });
    fireEvent.click(nameButton);

    expect(screen.getByTestId('inline-editor')).toBeInTheDocument();
    expect(editorSpy).toHaveBeenCalledWith(expect.objectContaining({
      initialTab: 'demographics',
      patient: expect.objectContaining({ id: 'patient-1' }),
    }));
  });

  it('toggles selection checkbox', () => {
    const onToggleSelect = vi.fn();
    const { container } = render(
      <ExecutivePatientRow
        patient={createPatient()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        selectionMode
        selected={false}
        onToggleSelect={onToggleSelect}
        addToast={vi.fn()}
        selectedDate="2025-01-01"
      />
    );

    const checkbox = container.querySelector('div.mr-1');
    expect(checkbox).toBeTruthy();
    if (checkbox) {
      fireEvent.click(checkbox);
    }
    expect(onToggleSelect).toHaveBeenCalled();
  });

  it('copies RUT to clipboard and shows toast', async () => {
    const addToast = vi.fn();
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ExecutivePatientRow
        patient={createPatient({ rut: '12.345.678-9' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        addToast={addToast}
        selectedDate="2025-01-01"
      />
    );

    fireEvent.click(screen.getByTitle('Copiar RUT'));
    expect(writeText).toHaveBeenCalledWith('12.345.678-9');
    expect(addToast).toHaveBeenCalledWith('success', 'RUT copiado');
  });

  it('shows attachment count badge', () => {
    render(
      <ExecutivePatientRow
        patient={createPatient({ attachedFiles: [{ id: 'file-1', name: 'a.pdf', url: 'x' } as any, { id: 'file-2', name: 'b.pdf', url: 'y' } as any] })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        addToast={vi.fn()}
        selectedDate="2025-01-01"
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles blank patient delete', () => {
    const onDelete = vi.fn();
    render(
      <ExecutivePatientRow
        patient={createPatient({ name: '', diagnosis: '', clinicalNote: '' })}
        onEdit={vi.fn()}
        onDelete={onDelete}
        addToast={vi.fn()}
        selectedDate="2025-01-01"
      />
    );

    fireEvent.click(screen.getByTitle('Eliminar Paciente'));
    expect(onDelete).toHaveBeenCalledWith('patient-1');
  });

  it('updates patient on inline save', () => {
    const updatePatient = vi.fn();
    useAppStore.setState({ updatePatient, patientTypes });

    render(
      <ExecutivePatientRow
        patient={createPatient()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        addToast={vi.fn()}
        selectedDate="2025-01-01"
      />
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Paciente Uno/i }));
    });
    const editorProps = editorSpy.mock.calls[0]?.[0];
    act(() => {
      editorProps.onSave(createPatient({ name: 'Paciente Dos' }));
    });
    expect(updatePatient).toHaveBeenCalledWith(expect.objectContaining({ name: 'Paciente Dos' }));
  });
});
