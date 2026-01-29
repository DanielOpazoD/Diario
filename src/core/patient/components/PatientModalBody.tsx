import React from 'react';
import { AttachedFile, PendingTask, PatientCreateInput, PatientRecord, PatientTypeConfig, PatientUpdateInput } from '@shared/types';
import ClinicalNote from '@core/patient/components/ClinicalNote';
import PatientForm from '@core/patient/components/PatientForm';
import PatientAttachmentsSection from '@core/patient/components/PatientAttachmentsSection';
import { formatPatientName } from '@core/patient/utils/patientUtils';
import { sanitizeClinicalNote, sanitizeDiagnosis, sanitizeRut } from '@shared/utils/sanitization';

interface PatientModalBodyProps {
  patientTypes: PatientTypeConfig[];
  isEditingDemographics: boolean;
  activeTab: 'clinical' | 'files';
  name: string;
  rut: string;
  birthDate: string;
  gender: string;
  typeId: string;
  entryTime: string;
  exitTime: string;
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: PendingTask[];
  attachedFiles: AttachedFile[];
  patientId: string;
  driveFolderId: string | null;
  isTurno: boolean;
  isListening: boolean;
  isAnalyzing: boolean;
  isSummarizing: boolean;
  isExtractingFromFiles: boolean;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onRutChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onSelectType: (typeIdValue: string, typeLabel: string) => void;
  onEntryTimeChange: (value: string) => void;
  onExitTimeChange: (value: string) => void;
  onExtractFromAttachments: () => void;
  onDiagnosisChange: (value: string) => void;
  onClinicalNoteChange: (value: string) => void;
  onToggleListening: () => void;
  onAnalyze: () => void;
  onSummary: () => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onChangeTab: (tab: 'clinical' | 'files') => void;
  onFilesChange: (files: AttachedFile[]) => void;
  onDriveFolderIdChange: (folderId: string | null) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const buildPatientPayload = ({
  initialData,
  selectedDate,
  patientTypes,
  name,
  rut,
  birthDate,
  gender,
  type,
  typeId,
  entryTime,
  exitTime,
  diagnosis,
  clinicalNote,
  pendingTasks,
  attachedFiles,
  patientId,
  driveFolderId,
}: {
  initialData?: PatientRecord | null;
  selectedDate: string;
  patientTypes: PatientTypeConfig[];
  name: string;
  rut: string;
  birthDate: string;
  gender: string;
  type: string;
  typeId: string;
  entryTime: string;
  exitTime: string;
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: PendingTask[];
  attachedFiles: AttachedFile[];
  patientId: string;
  driveFolderId: string | null;
}): PatientCreateInput | PatientUpdateInput => {
  const finalName = formatPatientName(name);
  const selectedType = patientTypes.find(t => t.id === typeId);

  const basePayload = {
    ...(initialData || {}),
    ...(initialData ? {} : { id: patientId }),
    name: finalName,
    rut: sanitizeRut(rut),
    birthDate,
    gender,
    type: selectedType?.label || type,
    typeId: selectedType?.id || typeId,
    entryTime: entryTime || undefined,
    exitTime: exitTime || undefined,
    diagnosis: sanitizeDiagnosis(diagnosis),
    clinicalNote: sanitizeClinicalNote(clinicalNote),
    pendingTasks,
    attachedFiles,
    driveFolderId,
    date: initialData ? initialData.date : selectedDate,
  };

  if (initialData) {
    return basePayload as PatientUpdateInput;
  }

  return basePayload as PatientCreateInput;
};

const PatientModalBody: React.FC<PatientModalBodyProps> = ({
  patientTypes,
  isEditingDemographics,
  activeTab,
  name,
  rut,
  birthDate,
  gender,
  typeId,
  entryTime,
  exitTime,
  diagnosis,
  clinicalNote,
  pendingTasks,
  attachedFiles,
  patientId,
  driveFolderId,
  isTurno,
  isListening,
  isAnalyzing,
  isSummarizing,
  isExtractingFromFiles,
  onNameChange,
  onNameBlur,
  onRutChange,
  onBirthDateChange,
  onGenderChange,
  onSelectType,
  onEntryTimeChange,
  onExitTimeChange,
  onExtractFromAttachments,
  onDiagnosisChange,
  onClinicalNoteChange,
  onToggleListening,
  onAnalyze,
  onSummary,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onChangeTab,
  onFilesChange,
  onDriveFolderIdChange,
  addToast,
}) => (
  <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/20 dark:bg-gray-900/10">
    <div className="flex flex-col gap-0">
      {isEditingDemographics && (
        <div className="px-3 md:px-5 py-2 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 animate-fade-in shadow-inner">
          <PatientForm
            name={name}
            rut={rut}
            birthDate={birthDate}
            gender={gender}
            typeId={typeId}
            patientTypes={patientTypes}
            isTurno={isTurno}
            entryTime={entryTime}
            exitTime={exitTime}
            onNameChange={onNameChange}
            onNameBlur={onNameBlur}
            onRutChange={onRutChange}
            onBirthDateChange={onBirthDateChange}
            onGenderChange={onGenderChange}
            onSelectType={onSelectType}
            onEntryTimeChange={onEntryTimeChange}
            onExitTimeChange={onExitTimeChange}
            isExtractingFromFiles={isExtractingFromFiles}
            onExtractFromAttachments={onExtractFromAttachments}
            superMinimalist={true}
          />
        </div>
      )}

      <div className="p-3 md:p-4">
        <ClinicalNote
          diagnosis={diagnosis}
          clinicalNote={clinicalNote}
          pendingTasks={pendingTasks}
          isListening={isListening}
          isAnalyzing={isAnalyzing}
          activeTab={activeTab}
          attachmentsCount={attachedFiles.length}
          onDiagnosisChange={onDiagnosisChange}
          onClinicalNoteChange={onClinicalNoteChange}
          onToggleListening={onToggleListening}
          onAnalyze={onAnalyze}
          onSummary={onSummary}
          isSummarizing={isSummarizing}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
          onChangeTab={onChangeTab}
          attachmentsSection={(
            <PatientAttachmentsSection
              attachedFiles={attachedFiles}
              patientId={patientId}
              patientRut={rut}
              patientName={name}
              driveFolderId={driveFolderId}
              addToast={addToast}
              onFilesChange={onFilesChange}
              onDriveFolderIdChange={onDriveFolderIdChange}
            />
          )}
        />
      </div>
    </div>
  </div>
);

export default PatientModalBody;
