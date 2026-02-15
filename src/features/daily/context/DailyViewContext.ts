import { createContext, useContext } from 'react';
import { PatientRecord, PatientTypeConfig } from '@shared/types';

export interface DailyViewContextType {
    // State
    currentDate: Date;
    selectedDate: string;
    records: PatientRecord[];
    patientTypes: PatientTypeConfig[];

    // Metrics & Filtering
    dailyRecords: PatientRecord[];
    pendingTasks: number;
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    summaryStats: Array<{
        id: string;
        label: string;
        count: number;
        color?: string;
    }>;
    visibleRecords: PatientRecord[];

    // Batch Operations
    selectionMode: boolean;
    selectedPatients: Set<string>;
    targetDate: string;
    toggleSelectionMode: () => void;
    togglePatientSelection: (patientId: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setTargetDate: (date: string) => void;
    handleBatchMove: () => void;
    handleBatchCopy: () => void;
    selectedCount: number;

    // Actions
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
    onEditPatient: (patient: PatientRecord, initialTab?: 'clinical' | 'files') => void;
    onDeletePatient: (patientId: string) => void;
    handleAddBlankPatient: () => void;
}

export const DailyViewContext = createContext<DailyViewContextType | null>(null);

export const useDailyViewContext = () => {
    const context = useContext(DailyViewContext);
    if (!context) {
        throw new Error('useDailyViewContext must be used within a DailyViewProvider');
    }
    return context;
};
