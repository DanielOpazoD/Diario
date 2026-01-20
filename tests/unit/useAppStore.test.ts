import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAppStore from '@core/stores/useAppStore';
import { PatientRecord } from '@shared/types';

describe('useAppStore', () => {
    beforeEach(() => {
        // Reset store state before each test if possible, 
        // but since it's a singleton we can manually clear records
        useAppStore.setState({ records: [], toasts: [], generalTasks: [] });
        vi.clearAllMocks();
    });

    it('initially has no records', () => {
        const state = useAppStore.getState();
        expect(state.records).toEqual([]);
    });

    it('adds a patient record successfully', () => {
        const patient: PatientRecord = {
            id: 'test-1',
            name: 'Juan Pérez',
            rut: '12345678-9',
            diagnosis: 'Hipotensión',
            clinicalNote: 'Paciente estable',
            date: '2024-03-20',
            type: 'Hospitalizado',
            pendingTasks: [],
            attachedFiles: [],
            createdAt: Date.now(),
        };

        useAppStore.getState().addPatient(patient);

        const records = useAppStore.getState().records;
        expect(records).toHaveLength(1);
        expect(records[0].name).toBe('Juan Pérez');
    });

    it('updates an existing patient record', () => {
        const patient: PatientRecord = {
            id: 'test-1',
            name: 'Old Name',
            rut: '123',
            diagnosis: '',
            clinicalNote: '',
            date: '2024-03-20',
            type: 'Extra',
            pendingTasks: [],
            attachedFiles: [],
            createdAt: Date.now(),
        };

        const store = useAppStore.getState();
        store.addPatient(patient);

        store.updatePatient({ ...patient, name: 'New Name' });

        const updated = useAppStore.getState().records.find(r => r.id === 'test-1');
        expect(updated?.name).toBe('New Name');
    });

    it('deletes a patient record', () => {
        const patient: PatientRecord = {
            id: 'to-delete',
            name: 'Delete Me',
            rut: '000',
            diagnosis: '',
            clinicalNote: '',
            date: '2024-03-20',
            type: 'Turno',
            pendingTasks: [],
            attachedFiles: [],
            createdAt: Date.now(),
        };

        useAppStore.getState().addPatient(patient);
        expect(useAppStore.getState().records).toHaveLength(1);

        useAppStore.getState().deletePatient('to-delete');
        expect(useAppStore.getState().records).toHaveLength(0);
    });

    it('handles toasts correctly', () => {
        useAppStore.getState().addToast('success', 'Operación exitosa');

        let toasts = useAppStore.getState().toasts;
        expect(toasts).toHaveLength(1);
        expect(toasts[0].message).toBe('Operación exitosa');
        expect(toasts[0].type).toBe('success');

        const id = toasts[0].id;
        useAppStore.getState().removeToast(id);
        expect(useAppStore.getState().toasts).toHaveLength(0);
    });

    it('manages theme switching', () => {
        const initialTheme = useAppStore.getState().theme;
        useAppStore.getState().toggleTheme();

        expect(useAppStore.getState().theme).not.toBe(initialTheme);
    });
});
