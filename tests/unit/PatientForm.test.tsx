import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientForm from '@core/patient/components/PatientForm';
import { PatientTypeConfig } from '@shared/types';

const basePatientTypes: PatientTypeConfig[] = [
  { id: 'policlinico', label: 'Policlínico', colorClass: 'bg-blue-500' },
];

const renderForm = (overrides: Partial<React.ComponentProps<typeof PatientForm>> = {}) => {
  const props: React.ComponentProps<typeof PatientForm> = {
    name: '',
    rut: '',
    birthDate: '',
    gender: '',
    typeId: 'policlinico',
    patientTypes: basePatientTypes,
    isTurno: false,
    entryTime: '',
    exitTime: '',
    onNameChange: vi.fn(),
    onNameBlur: vi.fn(),
    onRutChange: vi.fn(),
    onBirthDateChange: vi.fn(),
    onGenderChange: vi.fn(),
    onSelectType: vi.fn(),
    onEntryTimeChange: vi.fn(),
    onExitTimeChange: vi.fn(),
    ...overrides,
  };

  return render(<PatientForm {...props} />);
};

describe('PatientForm', () => {
  it('triggers IA scan from attachments', async () => {
    const onExtractFromAttachments = vi.fn();

    renderForm({
      name: 'Paciente Uno',
      onExtractFromAttachments,
      isExtractingFromFiles: false,
      defaultExpanded: true,
    });

    const buttons = screen.getAllByText('IA SCAN');
    expect(buttons.length).toBeGreaterThan(0);

    fireEvent.click(buttons[0]);

    expect(onExtractFromAttachments).toHaveBeenCalled();
  });

  it('allows extracting from a selected attachment', async () => {
    const onExtractFromAttachment = vi.fn();

    renderForm({
      name: 'Paciente Uno',
      onExtractFromAttachment,
      defaultExpanded: true,
      attachedFiles: [
        {
          id: 'file-1',
          name: 'Informe.pdf',
          mimeType: 'application/pdf',
          size: 123,
          uploadedAt: Date.now(),
          driveUrl: 'https://example.com/file.pdf',
        },
      ],
    });

    const updateButton = screen.getByText('ACTUALIZAR');
    fireEvent.click(updateButton);

    expect(onExtractFromAttachment).toHaveBeenCalledWith('file-1');
  });
});
