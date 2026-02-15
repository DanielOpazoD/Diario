import React, { useMemo, useCallback } from 'react';
import { PatientRecord, PatientTypeConfig } from '@shared/types';
import { formatLocalYMD } from '@shared/utils/dateUtils';
import useAppStore from '@core/stores/useAppStore';
import { DEFAULT_PATIENT_TYPE_ID, DEFAULT_PATIENT_TYPE_LABEL } from '@shared/constants/patientDefaults';
import { useDailyMetrics } from '@shared/hooks/useDailyMetrics';
import { usePatientFilter } from '@shared/hooks/usePatientFilter';
import { useBatchOperations } from '@shared/hooks/useBatchOperations';
import { DailyViewContext } from './DailyViewContext';

interface DailyViewProviderProps {
    children: React.ReactNode;
    currentDate: Date;
    records: PatientRecord[];
    patientTypes: PatientTypeConfig[];
    onEditPatient: (patient: PatientRecord, initialTab?: 'clinical' | 'files') => void;
    onDeletePatient: (patientId: string) => void;
    onMovePatients: (patientIds: string[], targetDate: string) => void;
    onCopyPatients: (patientIds: string[], targetDate: string) => void;
}

export const DailyViewProvider: React.FC<DailyViewProviderProps> = ({
    children,
    currentDate,
    records,
    patientTypes,
    onEditPatient,
    onDeletePatient,
    onMovePatients,
    onCopyPatients,
}) => {
    const addToast = useAppStore(state => state.addToast);
    const addPatient = useAppStore(state => state.addPatient);
    const selectedDate = useMemo(() => formatLocalYMD(currentDate), [currentDate]);

    const { dailyRecords, pendingTasks } = useDailyMetrics(records, currentDate);
    const { activeFilter, setActiveFilter, summaryStats, visibleRecords } = usePatientFilter(
        dailyRecords,
        patientTypes,
    );

    const {
        selectionMode,
        selectedPatients,
        targetDate,
        toggleSelectionMode,
        togglePatientSelection,
        selectAll: internalSelectAll,
        clearSelection,
        setTargetDate,
        handleBatchMove,
        handleBatchCopy,
        selectedCount,
    } = useBatchOperations({
        onMovePatients,
        onCopyPatients,
        addToast,
        initialTargetDate: selectedDate,
    });

    const selectAll = useCallback(() => {
        internalSelectAll(visibleRecords.map(r => r.id));
    }, [internalSelectAll, visibleRecords]);

    const handleAddBlankPatient = useCallback(() => {
        const defaultTypeId = patientTypes[0]?.id || DEFAULT_PATIENT_TYPE_ID;
        const defaultTypeLabel = patientTypes[0]?.label || DEFAULT_PATIENT_TYPE_LABEL;

        const blankPatient: PatientRecord = {
            id: crypto.randomUUID(),
            date: selectedDate,
            name: '',
            rut: '',
            birthDate: '',
            gender: '',
            type: defaultTypeLabel,
            typeId: defaultTypeId,
            diagnosis: '',
            clinicalNote: '',
            pendingTasks: [],
            attachedFiles: [],
            createdAt: Date.now(),
        };

        addPatient(blankPatient);
        addToast('info', 'Nuevo paciente en blanco creado. Haz clic para completar sus datos.');
    }, [patientTypes, selectedDate, addPatient, addToast]);

    const value = useMemo(() => ({
        currentDate,
        selectedDate,
        records,
        patientTypes,
        dailyRecords,
        pendingTasks,
        activeFilter,
        setActiveFilter,
        summaryStats,
        visibleRecords,
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
        selectedCount,
        addToast,
        onEditPatient,
        onDeletePatient,
        handleAddBlankPatient,
    }), [
        currentDate, selectedDate, records, patientTypes, dailyRecords, pendingTasks,
        activeFilter, setActiveFilter, summaryStats, visibleRecords, selectionMode,
        selectedPatients, targetDate, toggleSelectionMode, togglePatientSelection,
        selectAll, clearSelection, setTargetDate, handleBatchMove, handleBatchCopy,
        selectedCount, addToast, onEditPatient, onDeletePatient, handleAddBlankPatient
    ]);

    return (
        <DailyViewContext.Provider value={value}>
            {children}
        </DailyViewContext.Provider>
    );
};
