import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePatientCrud } from '@core/patient';

describe('usePatientCrud', () => {
    const mockAddPatient = vi.fn();
    const mockUpdatePatient = vi.fn();
    const mockDeletePatient = vi.fn();
    const mockSetRecords = vi.fn();
    const mockAddToast = vi.fn();
    const mockSetEditingPatient = vi.fn();
    const mockSetPatientToDelete = vi.fn();

    const baseParams = {
        records: [],
        editingPatient: null,
        patientToDelete: null,
        setEditingPatient: mockSetEditingPatient,
        setPatientToDelete: mockSetPatientToDelete,
        setRecords: mockSetRecords,
        addPatient: mockAddPatient,
        updatePatient: mockUpdatePatient,
        deletePatient: mockDeletePatient,
        addToast: mockAddToast,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles saving a new patient', () => {
        const { result } = renderHook(() => usePatientCrud(baseParams));

        const patientData = { name: 'PEDRO PICAPIEDRA', date: '2024-03-20', type: 'Hospitalizado' };

        act(() => {
            result.current.handleSavePatient(patientData);
        });

        expect(mockAddPatient).toHaveBeenCalled();
        // Verify title case conversion
        const addedPatient = mockAddPatient.mock.calls[0][0];
        expect(addedPatient.name).toBe('Pedro Picapiedra');
        expect(mockAddToast).toHaveBeenCalledWith('success', 'Nuevo paciente registrado');
        expect(mockSetEditingPatient).toHaveBeenCalledWith(null);
    });

    it('handles updating an existing patient', () => {
        const editingPatient = { id: '1', name: 'Old Name', createdAt: 123 } as any;
        const { result } = renderHook(() => usePatientCrud({ ...baseParams, editingPatient }));

        act(() => {
            result.current.handleSavePatient({ name: 'new name' });
        });

        expect(mockUpdatePatient).toHaveBeenCalled();
        const updatedPatient = mockUpdatePatient.mock.calls[0][0];
        expect(updatedPatient.name).toBe('New Name');
        expect(updatedPatient.id).toBe('1');
        expect(mockAddToast).toHaveBeenCalledWith('success', 'Paciente actualizado');
    });

    it('confirms deletion when patientToDelete is set', () => {
        const { result } = renderHook(() => usePatientCrud({ ...baseParams, patientToDelete: 'id-to-delete' }));

        act(() => {
            result.current.confirmDeletePatient();
        });

        expect(mockDeletePatient).toHaveBeenCalledWith('id-to-delete');
        expect(mockAddToast).toHaveBeenCalledWith('info', 'Registro eliminado');
        expect(mockSetPatientToDelete).toHaveBeenCalledWith(null);
    });

    it('does nothing on confirmDelete if no patientToDelete', () => {
        const { result } = renderHook(() => usePatientCrud(baseParams));

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
        const { result } = renderHook(() => usePatientCrud({ ...baseParams, records }));

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
        const { result } = renderHook(() => usePatientCrud({ ...baseParams, records }));

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
