import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InlinePatientFiles from '@core/patient/components/InlinePatientFiles';

const attachmentsSpy = vi.fn();

vi.mock('@core/patient/components/PatientAttachmentsSection', () => ({
  default: (props: any) => {
    attachmentsSpy(props);
    return <div data-testid="attachments" />;
  },
}));

describe('InlinePatientFiles', () => {
  it('passes props to PatientAttachmentsSection', () => {
    render(
      <InlinePatientFiles
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

    expect(screen.getByTestId('attachments')).toBeInTheDocument();
    expect(attachmentsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-1',
        patientRut: '1-9',
        patientName: 'Paciente',
        compact: true,
      })
    );
  });
});
