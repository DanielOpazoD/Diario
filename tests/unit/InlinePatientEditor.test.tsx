import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import InlinePatientEditor from '@core/patient/components/InlinePatientEditor';
import { PatientRecord, PatientTypeConfig } from '@shared/types';
import useAppStore from '@core/stores/useAppStore';

const demographicsSpy = vi.fn();
const clinicalSpy = vi.fn();
const filesSpy = vi.fn();
const tasksSpy = vi.fn();

vi.mock('@core/patient/components/InlinePatientDemographics', () => ({
  default: (props: any) => {
    demographicsSpy(props);
    return <div data-testid="demographics" />;
  },
}));

vi.mock('@core/patient/components/InlinePatientClinical', () => ({
  default: (props: any) => {
    clinicalSpy(props);
    return <div data-testid="clinical" />;
  },
}));

vi.mock('@core/patient/components/InlinePatientFiles', () => ({
  default: (props: any) => {
    filesSpy(props);
    return <div data-testid="files" />;
  },
}));

vi.mock('@core/patient/components/InlinePatientTasks', () => ({
  default: (props: any) => {
    tasksSpy(props);
    return <div data-testid="tasks" />;
  },
}));

vi.mock('@core/patient', () => ({
  usePatientVoiceAndAI: () => ({
    isAnalyzing: false,
    isSummarizing: false,
    isListening: false,
    toggleListening: vi.fn(),
    handleAIAnalysis: vi.fn(),
    handleClinicalSummary: vi.fn(),
  }),
  usePatientDataExtraction: () => ({
    isExtractingFromFiles: false,
    handleExtractFromAttachments: vi.fn(),
  }),
}));

describe('InlinePatientEditor', () => {
  const patientTypes: PatientTypeConfig[] = [
    { id: 'policlinico', label: 'Policlínico', colorClass: 'bg-blue-500' },
  ];

  const basePatient: PatientRecord = {
    id: 'patient-1',
    name: 'Paciente Uno',
    rut: '1-9',
    date: '2025-01-01',
    type: 'Policlínico',
    typeId: 'policlinico',
    diagnosis: '',
    clinicalNote: '',
    pendingTasks: [],
    attachedFiles: [],
  };

  beforeEach(() => {
    useAppStore.setState({ patientTypes });
    demographicsSpy.mockClear();
    clinicalSpy.mockClear();
    filesSpy.mockClear();
    tasksSpy.mockClear();
  });

  it('renders clinical tab and triggers save/cancel', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <InlinePatientEditor
        patient={basePatient}
        initialTab="clinical"
        onClose={onClose}
        onSave={onSave}
        addToast={vi.fn()}
        selectedDate="2025-01-01"
      />
    );

    expect(screen.getByTestId('clinical')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Guardar'));
    expect(onSave).toHaveBeenCalled();
  });

  it('renders demographics tab and passes props', () => {
    render(
      <InlinePatientEditor
        patient={basePatient}
        initialTab="demographics"
        onClose={vi.fn()}
        onSave={vi.fn()}
        addToast={vi.fn()}
        selectedDate="2025-01-01"
      />
    );

    expect(screen.getByTestId('demographics')).toBeInTheDocument();
    expect(demographicsSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Paciente Uno',
      rut: '1-9',
      typeId: 'policlinico',
    }));
  });
});
