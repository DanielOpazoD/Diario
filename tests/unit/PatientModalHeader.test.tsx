import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientModalHeader from '@core/patient/components/PatientModalHeader';

const renderHeader = (overrides: Partial<React.ComponentProps<typeof PatientModalHeader>> = {}) => {
  const props: React.ComponentProps<typeof PatientModalHeader> = {
    isNewPatient: false,
    name: 'Paciente Uno',
    rut: '1-9',
    age: '34',
    gender: 'F',
    date: '2025-01-01',
    isEditing: false,
    onEditToggle: vi.fn(),
    isScanning: false,
    isScanningMulti: false,
    fileInputRef: createRef<HTMLInputElement>(),
    multiFileInputRef: createRef<HTMLInputElement>(),
    onFileUpload: vi.fn(),
    onMultiFileUpload: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };

  return render(<PatientModalHeader {...props} />);
};

describe('PatientModalHeader', () => {
  it('renders patient name and date badge', () => {
    renderHeader();

    expect(screen.getByText('Paciente Uno')).toBeInTheDocument();
    expect(screen.getByText('01-01-2025')).toBeInTheDocument();
  });

  it('renders rut, age, and gender details', () => {
    renderHeader({ rut: '12.345.678-9', age: '45', gender: 'M' });

    expect(screen.getByText('12.345.678-9')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('calls edit toggle and close', () => {
    const onEditToggle = vi.fn();
    const onClose = vi.fn();

    const { container } = renderHeader({ onEditToggle, onClose });

    const editToggle = container.querySelector('div.cursor-pointer');
    expect(editToggle).toBeTruthy();
    if (editToggle) {
      fireEvent.click(editToggle);
    }

    expect(onEditToggle).toHaveBeenCalled();

    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows scan actions for new patient', () => {
    renderHeader({ isNewPatient: true, name: '' });

    expect(screen.getByText('Nuevo Ingreso')).toBeInTheDocument();
    expect(screen.getByText('Lista')).toBeInTheDocument();
    expect(screen.getByText('Ficha')).toBeInTheDocument();
  });

  it('does not show date badge for new patient', () => {
    renderHeader({ isNewPatient: true, name: '' });
    expect(screen.queryByText('01-01-2025')).toBeNull();
  });

  it('triggers scan buttons to click hidden inputs', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');

    renderHeader({
      isNewPatient: true,
      name: '',
    });

    fireEvent.click(screen.getByText('Lista'));
    fireEvent.click(screen.getByText('Ficha'));

    expect(clickSpy).toHaveBeenCalledTimes(2);
    clickSpy.mockRestore();
  });
});
