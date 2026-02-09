import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PatientModal from '@core/patient/components/PatientModal';
import { calculateAge } from '@shared/utils/dateUtils';

const headerSpy = vi.fn();
const bodySpy = vi.fn();
const footerSpy = vi.fn();

const mockStoreState = {
  patientTypes: [
    { id: 'policlinico', label: 'Policlínico' },
    { id: 'turno', label: 'Turno' },
  ],
};

const modalState = {
  name: '',
  setName: vi.fn(),
  rut: '',
  setRut: vi.fn(),
  patientId: 'patient-1',
  birthDate: '',
  setBirthDate: vi.fn(),
  gender: '',
  setGender: vi.fn(),
  type: '',
  setType: vi.fn(),
  typeId: 'policlinico',
  setTypeId: vi.fn(),
  entryTime: '',
  setEntryTime: vi.fn(),
  exitTime: '',
  setExitTime: vi.fn(),
  diagnosis: '',
  setDiagnosis: vi.fn(),
  clinicalNote: '',
  setClinicalNote: vi.fn(),
  pendingTasks: [],
  setPendingTasks: vi.fn(),
  attachedFiles: [],
  setAttachedFiles: vi.fn(),
  driveFolderId: '',
  setDriveFolderId: vi.fn(),
  activeTab: 'clinical' as const,
  setActiveTab: vi.fn(),
  isEditingDemographics: false,
  setIsEditingDemographics: vi.fn(),
};

vi.mock('@core/stores/useAppStore', () => ({
  default: (selector?: any) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    return mockStoreState;
  },
}));

vi.mock('@core/patient/hooks/usePatientModalState', () => ({
  default: () => modalState,
}));

vi.mock('@core/patient/hooks/usePendingTasks', () => ({
  default: () => ({
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
    addTask: vi.fn(),
    updateTaskNote: vi.fn(),
  }),
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
    fileInputRef: { current: null },
    multiFileInputRef: { current: null },
    isScanning: false,
    isScanningMulti: false,
    isExtractingFromFiles: false,
    handleImageUpload: vi.fn(),
    handleMultiImageUpload: vi.fn(),
    handleExtractFromAttachments: vi.fn(),
  }),
}));

vi.mock('@core/patient/components/PatientModalHeader', () => ({
  default: (props: any) => {
    headerSpy(props);
    return <div data-testid="modal-header" />;
  },
}));

vi.mock('@core/patient/components/PatientModalBody', () => ({
  default: (props: any) => {
    bodySpy(props);
    return <div data-testid="modal-body" />;
  },
}));

vi.mock('@use-cases/patient/buildPayload', () => ({
  buildPatientPayload: vi.fn(() => ({ name: 'Paciente', date: '2024-01-01' })),
}));

vi.mock('@core/patient/components/PatientModalFooter', () => ({
  default: (props: any) => {
    footerSpy(props);
    return (
      <div data-testid="modal-footer">
        <button type="button" onClick={props.onSave}>save</button>
        <button type="button" onClick={props.onCancel}>cancel</button>
      </div>
    );
  },
}));

const renderModal = (overrides: Partial<React.ComponentProps<typeof PatientModal>> = {}) => {
  const props: React.ComponentProps<typeof PatientModal> = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onAutoSave: vi.fn(),
    addToast: vi.fn(),
    selectedDate: '2024-01-01',
    ...overrides,
  };

  return render(<PatientModal {...props} />);
};

describe('PatientModal', () => {
  beforeEach(() => {
    headerSpy.mockClear();
    bodySpy.mockClear();
    footerSpy.mockClear();
    modalState.name = '';
  });

  it('renders nothing when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByTestId('modal-header')).toBeNull();
  });

  it('shows error when saving without name', () => {
    const addToast = vi.fn();
    renderModal({ addToast });
    fireEvent.click(screen.getByText('save'));
    expect(addToast).toHaveBeenCalledWith('error', 'Nombre requerido');
  });

  it('calls onSave and onClose when saving with name', () => {
    modalState.name = 'Maria';
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSave, onClose });
    fireEvent.click(screen.getByText('save'));
    expect(onSave).toHaveBeenCalledWith({ name: 'Paciente', date: '2024-01-01' });
    expect(onClose).toHaveBeenCalled();
  });

  it('wires header props and edit toggle', () => {
    modalState.birthDate = '2000-01-01';
    const setIsEditingDemographics = vi.fn();
    modalState.setIsEditingDemographics = setIsEditingDemographics;
    renderModal();
    const headerProps = headerSpy.mock.calls[0]?.[0];
    expect(headerProps.age).toBe(calculateAge('2000-01-01'));
    headerProps.onEditToggle();
    expect(setIsEditingDemographics).toHaveBeenCalled();
  });

  it('wires body tab change handler', () => {
    const setActiveTab = vi.fn();
    modalState.setActiveTab = setActiveTab;
    renderModal();
    const bodyProps = bodySpy.mock.calls[0]?.[0];
    bodyProps.onChangeTab('files');
    expect(setActiveTab).toHaveBeenCalledWith('files');
  });
});
