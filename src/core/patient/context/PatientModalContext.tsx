import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    PatientRecord,
    PatientCreateInput,
    PatientTypeConfig,
    AttachedFile,
    PendingTask
} from '@shared/types';
import { DEFAULT_PATIENT_TYPE_ID } from '@shared/constants/patientDefaults';
import useAppStore from '@core/stores/useAppStore';
import usePatientModalState from '@core/patient/hooks/usePatientModalState';
import { usePatientVoiceAndAI, usePatientDataExtraction } from '@core/patient';
import usePendingTasks from '@core/patient/hooks/usePendingTasks';
import { sanitizePatientName } from '@use-cases/patient/sanitizeFields';

interface PatientModalContextType {
    // State
    name: string;
    rut: string;
    birthDate: string;
    gender: string;
    typeId: string;
    type: string;
    entryTime: string;
    exitTime: string;
    diagnosis: string;
    clinicalNote: string;
    pendingTasks: PendingTask[];
    attachedFiles: AttachedFile[];
    patientId: string;
    driveFolderId: string | null;
    activeTab: 'clinical' | 'files';
    isEditingDemographics: boolean;
    isOpen: boolean;

    // UI State
    isTurno: boolean;
    isListening: boolean;
    isAnalyzing: boolean;
    isSummarizing: boolean;
    isExtractingFromFiles: boolean;
    patientTypes: PatientTypeConfig[];

    // Handlers
    setName: (name: string) => void;
    setRut: (rut: string) => void;
    setBirthDate: (date: string) => void;
    setGender: (gender: string) => void;
    setTypeId: (id: string) => void;
    setType: (type: string) => void;
    setEntryTime: (time: string) => void;
    setExitTime: (time: string) => void;
    setDiagnosis: (diagnosis: string) => void;
    setClinicalNote: (note: string) => void;
    setPendingTasks: React.Dispatch<React.SetStateAction<PendingTask[]>>;
    setAttachedFiles: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
    setDriveFolderId: (id: string | null) => void;
    onChangeTab: (tab: 'clinical' | 'files') => void;
    onFilesChange: (files: AttachedFile[]) => void;
    onDriveFolderIdChange: (folderId: string | null) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
    setIsEditingDemographics: React.Dispatch<React.SetStateAction<boolean>>;

    // Complex Handlers
    handleNameBlur: () => void;
    handleSelectType: (typeId: string, typeLabel: string) => void;
    handleExtractFromAttachments: () => void;
    toggleListening: () => void;
    handleAIAnalysis: () => void;
    handleClinicalSummary: () => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    addTask: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    updateTaskNote: (id: string, note: string) => void;

    // Refs/Other
    fileInputRef: React.RefObject<HTMLInputElement>;
    multiFileInputRef: React.RefObject<HTMLInputElement>;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMultiImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isScanning: boolean;
    isScanningMulti: boolean;
}

const PatientModalContext = createContext<PatientModalContextType | null>(null);

export const usePatientModalContext = () => {
    const context = useContext(PatientModalContext);
    if (!context) {
        throw new Error('usePatientModalContext must be used within a PatientModalProvider');
    }
    return context;
};

export const useOptionalPatientModalContext = () => {
    return useContext(PatientModalContext);
};

interface PatientModalProviderProps {
    children: React.ReactNode;
    initialData?: PatientRecord | null;
    selectedDate: string;
    initialTab?: 'clinical' | 'files';
    isOpen: boolean;
    onClose: () => void;
    onSaveMultiple?: (patients: PatientCreateInput[]) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const PatientModalProvider: React.FC<PatientModalProviderProps> = ({
    children,
    initialData,
    selectedDate,
    initialTab = 'clinical',
    isOpen,
    onClose,
    onSaveMultiple,
    addToast,
}) => {
    const patientTypes = useAppStore(useShallow(state => state.patientTypes));
    const defaultTypeId = useMemo(
        () => patientTypes.find(t => t.id === DEFAULT_PATIENT_TYPE_ID)?.id || patientTypes[0]?.id || '',
        [patientTypes]
    );

    const modalState = usePatientModalState({
        isOpen,
        initialData,
        initialTab,
        defaultTypeId,
        patientTypes,
    });

    const { setName, setRut, setBirthDate, setGender, setDiagnosis, setClinicalNote, setPendingTasks, setAttachedFiles, setDriveFolderId, setActiveTab, setType, setTypeId } = modalState;
    const { name, rut, birthDate, gender, diagnosis, clinicalNote, attachedFiles, typeId } = modalState;

    const {
        isAnalyzing, isSummarizing, isListening, toggleListening,
        handleAIAnalysis, handleClinicalSummary,
    } = usePatientVoiceAndAI({
        clinicalNote: modalState.clinicalNote,
        patientName: name,
        setClinicalNote,
        setDiagnosis,
        setPendingTasks,
        addToast,
    });

    const extraction = usePatientDataExtraction({
        addToast,
        selectedDate,
        onClose,
        onSaveMultiple,
        setName,
        setRut,
        setBirthDate,
        setGender,
        setDiagnosis,
        setClinicalNote,
    });

    const { toggleTask, deleteTask, addTask, updateTaskNote } = usePendingTasks({ setPendingTasks });

    const handleNameBlur = useCallback(() => {
        if (name) {
            setName(sanitizePatientName(name));
        }
    }, [name, setName]);

    const handleSelectType = useCallback((typeIdValue: string, typeLabel: string) => {
        setType(typeLabel);
        setTypeId(typeIdValue);
    }, [setType, setTypeId]);

    const handleChangeTab = useCallback((tab: 'clinical' | 'files') => {
        setActiveTab(tab);
    }, [setActiveTab]);

    const handleExtractFromAttachments = useCallback(() => {
        extraction.handleExtractFromAttachments(attachedFiles, {
            name, rut, birthDate, gender, diagnosis, clinicalNote
        });
    }, [attachedFiles, birthDate, clinicalNote, diagnosis, extraction, gender, name, rut]);

    const turnoTypeId = useMemo(
        () => patientTypes.find(t => t.id === 'turno')?.id || 'turno',
        [patientTypes]
    );
    const isTurno = useMemo(() => typeId === turnoTypeId, [typeId, turnoTypeId]);

    const value = {
        ...modalState,
        isOpen,
        isTurno,
        isListening,
        isAnalyzing,
        isSummarizing,
        isExtractingFromFiles: extraction.isExtractingFromFiles,
        patientTypes,
        handleNameBlur,
        handleSelectType,
        handleExtractFromAttachments,
        toggleListening,
        handleAIAnalysis,
        handleClinicalSummary,
        toggleTask,
        deleteTask,
        addTask,
        updateTaskNote,
        onChangeTab: handleChangeTab,
        onFilesChange: setAttachedFiles,
        onDriveFolderIdChange: setDriveFolderId,
        addToast,
        fileInputRef: extraction.fileInputRef,
        multiFileInputRef: extraction.multiFileInputRef,
        handleImageUpload: extraction.handleImageUpload,
        handleMultiImageUpload: extraction.handleMultiImageUpload,
        isScanning: extraction.isScanning,
        isScanningMulti: extraction.isScanningMulti,
    };

    return (
        <PatientModalContext.Provider value={value}>
            {children}
        </PatientModalContext.Provider>
    );
};
