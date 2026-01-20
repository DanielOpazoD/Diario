import { useState, useCallback } from 'react';

interface UseBatchOperationsProps {
    onMovePatients: (patientIds: string[], targetDate: string) => void;
    onCopyPatients: (patientIds: string[], targetDate: string) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
    initialTargetDate: string;
}

interface UseBatchOperationsReturn {
    selectionMode: boolean;
    selectedPatients: Set<string>;
    targetDate: string;
    toggleSelectionMode: () => void;
    togglePatientSelection: (patientId: string) => void;
    selectAll: (patientIds: string[]) => void;
    clearSelection: () => void;
    setTargetDate: (date: string) => void;
    handleBatchMove: () => void;
    handleBatchCopy: () => void;
    selectedCount: number;
}

/**
 * Custom hook for batch patient operations (selection, move, copy)
 * Extracted from DailyView for reusability and cleaner component code
 */
export const useBatchOperations = ({
    onMovePatients,
    onCopyPatients,
    addToast,
    initialTargetDate,
}: UseBatchOperationsProps): UseBatchOperationsReturn => {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
    const [targetDate, setTargetDate] = useState(initialTargetDate);

    const toggleSelectionMode = useCallback(() => {
        setSelectionMode((prev) => {
            if (prev) {
                setSelectedPatients(new Set());
            }
            return !prev;
        });
    }, []);

    const togglePatientSelection = useCallback((patientId: string) => {
        setSelectedPatients((prev) => {
            const next = new Set(prev);
            if (next.has(patientId)) {
                next.delete(patientId);
            } else {
                next.add(patientId);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback((patientIds: string[]) => {
        setSelectedPatients(new Set(patientIds));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedPatients(new Set());
    }, []);

    const handleBatchMove = useCallback(() => {
        if (selectedPatients.size === 0) {
            addToast('info', 'Selecciona al menos un paciente para mover.');
            return;
        }
        onMovePatients(Array.from(selectedPatients), targetDate);
        setSelectedPatients(new Set());
        setSelectionMode(false);
        addToast('success', `${selectedPatients.size} paciente(s) movido(s) exitosamente.`);
    }, [selectedPatients, targetDate, onMovePatients, addToast]);

    const handleBatchCopy = useCallback(() => {
        if (selectedPatients.size === 0) {
            addToast('info', 'Selecciona al menos un paciente para copiar.');
            return;
        }
        onCopyPatients(Array.from(selectedPatients), targetDate);
        setSelectedPatients(new Set());
        setSelectionMode(false);
        addToast('success', `${selectedPatients.size} paciente(s) copiado(s) exitosamente.`);
    }, [selectedPatients, targetDate, onCopyPatients, addToast]);

    return {
        selectionMode,
        selectedPatients,
        targetDate,
        toggleSelectionMode,
        togglePatientSelection,
        selectAll,
        clearSelection,
        setTargetDate,
        handleBatchMove,
        handleBatchCopy,
        selectedCount: selectedPatients.size,
    };
};

export default useBatchOperations;
