import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientTypeDropdown from '@core/patient/components/PatientTypeDropdown';
import { PatientTypeConfig } from '@shared/types';

const mockPatientTypes: PatientTypeConfig[] = [
    { id: 'hospitalizado', label: 'Hospitalizados', colorClass: 'bg-blue-600' },
    { id: 'policlinico', label: 'Policlínico', colorClass: 'bg-green-600' },
    { id: 'turno', label: 'Turno', colorClass: 'bg-amber-600' },
];

describe('PatientTypeDropdown', () => {
    const defaultProps = {
        typeId: 'hospitalizado',
        patientTypes: mockPatientTypes,
        placeholder: 'Seleccionar tipo',
        buttonClassName: 'test-button',
        onSelectType: vi.fn(),
    };

    it('renders correctly with initial selection', () => {
        render(<PatientTypeDropdown {...defaultProps} />);
        expect(screen.getByText('Hospitalizados')).toBeDefined();
    });

    it('opens menu when clicked', () => {
        render(<PatientTypeDropdown {...defaultProps} />);
        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(screen.getByText('Policlínico')).toBeDefined();
        expect(screen.getByText('Turno')).toBeDefined();
    });

    it('calls onSelectType and closes when an option is selected', () => {
        const onSelectType = vi.fn();
        render(<PatientTypeDropdown {...defaultProps} onSelectType={onSelectType} />);

        // Open menu
        fireEvent.click(screen.getByRole('button'));

        // Select option
        const option = screen.getByText('Turno');
        fireEvent.click(option);

        expect(onSelectType).toHaveBeenCalledWith('turno', 'Turno');
        expect(screen.queryByText('Policlínico')).toBeNull();
    });

    it('does NOT close menu when clicking inside the portal content', () => {
        render(<PatientTypeDropdown {...defaultProps} />);

        // Open menu
        fireEvent.click(screen.getByRole('button'));

        // Find the menu container (the one with the portal ref)
        // In our implementation, the portal div has specific classes
        const menu = screen.getByText('Turno').closest('div');

        // Simulate mousedown inside the menu
        // This previously caused the menu to close because it wasn't recognized as "inside"
        fireEvent.mouseDown(menu!);

        // Menu should still be open
        expect(screen.getByText('Turno')).toBeDefined();
    });

    it('closes menu when clicking outside', () => {
        render(<PatientTypeDropdown {...defaultProps} />);

        // Open menu
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('Turno')).toBeDefined();

        // Simulate mousedown outside
        fireEvent.mouseDown(document.body);

        // Menu should be closed
        expect(screen.queryByText('Turno')).toBeNull();
    });
});
