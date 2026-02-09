import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InlinePatientDemographics from '@core/patient/components/InlinePatientDemographics';
import { PatientTypeConfig } from '@shared/types';

const patientFormSpy = vi.fn();

vi.mock('@core/patient/components/PatientForm', () => ({
  default: (props: any) => {
    patientFormSpy(props);
    return <div data-testid="patient-form" />;
  },
}));

describe('InlinePatientDemographics', () => {
  it('passes props to PatientForm', () => {
    const patientTypes: PatientTypeConfig[] = [
      { id: 'type-1', label: 'Policlínico', colorClass: 'bg-blue-500' },
    ];

    render(
      <InlinePatientDemographics
        name="Paciente"
        rut="1-9"
        birthDate="2000-01-01"
        gender="F"
        typeId="type-1"
        patientTypes={patientTypes}
        isTurno={false}
        entryTime=""
        exitTime=""
        isExtractingFromFiles={false}
        onExtractFromAttachments={vi.fn()}
        attachedFiles={[]}
        onExtractFromAttachment={vi.fn()}
        onNameChange={vi.fn()}
        onNameBlur={vi.fn()}
        onRutChange={vi.fn()}
        onBirthDateChange={vi.fn()}
        onGenderChange={vi.fn()}
        onSelectType={vi.fn()}
        onEntryTimeChange={vi.fn()}
        onExitTimeChange={vi.fn()}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('patient-form')).toBeInTheDocument();
    expect(patientFormSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Paciente',
        rut: '1-9',
        typeId: 'type-1',
        defaultExpanded: true,
        minimalist: true,
      })
    );
  });
});
