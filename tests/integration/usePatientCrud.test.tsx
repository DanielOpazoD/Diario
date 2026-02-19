import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePatientCrud } from '@core/patient';
import type { PatientCreateInput } from '@shared/types';

// Mock the state and actions hooks
vi.mock('@core/app/state/useAppState', () => ({
    useRecords: vi.fn(),
    useModalState: vi.fn(),
}));

vi.mock('@core/app/state/useAppActions', () => ({
    useAppActions: vi.fn(),
}));

import { useRecords, useModalState } from '@core/app/state/useAppState';
import { useAppActions } from '@core/app/state/useAppActions';

describe('usePatientCrud', () => {
    const mockAddPatient = vi.fn();
    const mockUpdatePatient = vi.fn();
    const mockDeletePatient = vi.fn();
    const mockSetRecords = vi.fn();
    const mockAddToast = vi.fn();
    const mockClosePatientModal = vi.fn();
    const mockCloseDeleteConfirmation = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        (useRecords as any).mockReturnValue([]);
        (useModalState as any).mockReturnValue({
            editingPatient: null,
            patientToDelete: null,
        });
        (useAppActions as any).mockReturnValue({
            setRecords: mockSetRecords,
            addPatient: mockAddPatient,
            updatePatient: mockUpdatePatient,
            deletePatient: mockDeletePatient,
            addToast: mockAddToast,
            closePatientModal: mockClosePatientModal,
            closeDeleteConfirmation: mockCloseDeleteConfirmation,
        });
    });

    const buildPatientFormData = (overrides: Partial<PatientCreateInput> = {}): PatientCreateInput => ({
        name: 'PACIENTE BASE',
        rut: '',
        date: '2024-03-20',
        type: 'Hospitalizado',
        diagnosis: '',
        clinicalNote: '',
        pendingTasks: [],
        attachedFiles: [],
        ...overrides,
    });

    it('handles saving a new patient', () => {
        const { result } = renderHook(() => usePatientCrud());

        const patientData = buildPatientFormData({ name: 'PEDRO PICAPIEDRA' });

        act(() => {
            result.current.handleSavePatient(patientData);
        });

        expect(mockAddPatient).toHaveBeenCalled();
        const addedPatient = mockAddPatient.mock.calls[0][0];
        expect(addedPatient.name).toBe('Pedro Picapiedra');
        expect(mockAddToast).toHaveBeenCalledWith('success', 'Nuevo paciente registrado');
        expect(mockClosePatientModal).toHaveBeenCalled();
    });

    it('handles updating an existing patient', () => {
        const editingPatient = { id: '1', name: 'Old Name', createdAt: 123 } as any;
        (useModalState as any).mockReturnValue({
            editingPatient,
            patientToDelete: null,
        });

        const { result } = renderHook(() => usePatientCrud());

        act(() => {
            result.current.handleSavePatient(buildPatientFormData({ name: 'new name' }));
        });

        expect(mockUpdatePatient).toHaveBeenCalled();
        const updatedPatient = mockUpdatePatient.mock.calls[0][0];
        expect(updatedPatient.name).toBe('New Name');
        expect(updatedPatient.id).toBe('1');
        expect(mockAddToast).toHaveBeenCalledWith('success', 'Paciente actualizado');
    });

    it('confirms deletion when patientToDelete is set', () => {
        (useModalState as any).mockReturnValue({
            editingPatient: null,
            patientToDelete: 'id-to-delete',
        });

        const { result } = renderHook(() => usePatientCrud());

        act(() => {
            result.current.confirmDeletePatient();
        });

        expect(mockDeletePatient).toHaveBeenCalledWith('id-to-delete');
        expect(mockAddToast).toHaveBeenCalledWith('info', 'Registro eliminado');
        expect(mockCloseDeleteConfirmation).toHaveBeenCalled();
    });

    it('does nothing on confirmDelete if no patientToDelete', () => {
        const { result } = renderHook(() => usePatientCrud());

        act(() => {
            result.current.confirmDeletePatient();
        });

        expect(mockDeletePatient).not.toHaveBeenCalled();
    });

    it('moves patients to a new date', () => {
        const records = [
            { id: 'p1', name: 'P1', date: '2024-01-01' },
            { id: 'p2', name: 'P2', date: '2024-01-01' }
        ] as any;
        (useRecords as any).mockReturnValue(records);

        const { result } = renderHook(() => usePatientCrud());

        act(() => {
            result.current.handleMovePatientsToDate(['p1'], '2024-01-02');
        });

        expect(mockSetRecords).toHaveBeenCalled();
        const newRecords = mockSetRecords.mock.calls[0][0];
        expect(newRecords.find((r: any) => r.id === 'p1').date).toBe('2024-01-02');
        expect(newRecords.find((r: any) => r.id === 'p2').date).toBe('2024-01-01');
    });

    it('copies patients to a new date with new IDs', () => {
        const records = [
            { id: 'p1', name: 'P1', date: '2024-01-01', pendingTasks: [], attachedFiles: [] }
        ] as any;
        (useRecords as any).mockReturnValue(records);

        const { result } = renderHook(() => usePatientCrud());

        act(() => {
            result.current.handleCopyPatientsToDate(['p1'], '2024-01-02');
        });

        expect(mockSetRecords).toHaveBeenCalled();
        const newRecords = mockSetRecords.mock.calls[0][0];
        expect(newRecords).toHaveLength(2); // Original + Copy
        expect(newRecords[1].id).not.toBe('p1');
        expect(newRecords[1].date).toBe('2024-01-02');
    });
});
