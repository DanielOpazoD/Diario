import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientAttachmentsSection from '@core/patient/components/PatientAttachmentsSection';

const managerSpy = vi.fn();

vi.mock('@features/files/FileAttachmentManager', () => ({
  default: (props: any) => {
    managerSpy(props);
    return <div data-testid="file-attachment-manager" />;
  },
}));

describe('PatientAttachmentsSection', () => {
  it('renders and passes props to FileAttachmentManager', () => {
    render(
      <PatientAttachmentsSection
        attachedFiles={[]}
        patientId="patient-1"
        patientRut="1-9"
        patientName="Paciente"
        driveFolderId={null}
        addToast={vi.fn()}
        onFilesChange={vi.fn()}
        onDriveFolderIdChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('file-attachment-manager')).toBeInTheDocument();
    expect(managerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-1',
        patientRut: '1-9',
        patientName: 'Paciente',
        compact: false,
      })
    );
  });

  it('uses compact styles when compact', () => {
    const { container } = render(
      <PatientAttachmentsSection
        attachedFiles={[]}
        patientId="patient-1"
        patientRut="1-9"
        patientName="Paciente"
        driveFolderId={null}
        addToast={vi.fn()}
        onFilesChange={vi.fn()}
        onDriveFolderIdChange={vi.fn()}
        compact
      />
    );

    expect(container.firstChild).toHaveClass('bg-transparent');
  });
});
