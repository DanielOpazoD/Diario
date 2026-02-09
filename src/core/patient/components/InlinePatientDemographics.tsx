import React from 'react';
import PatientForm from '@core/patient/components/PatientForm';
import { AttachedFile, PatientTypeConfig } from '@shared/types';

interface InlinePatientDemographicsProps {
  name: string;
  rut: string;
  birthDate: string;
  gender: string;
  typeId: string;
  patientTypes: PatientTypeConfig[];
  isTurno: boolean;
  entryTime: string;
  exitTime: string;
  isExtractingFromFiles: boolean;
  onExtractFromAttachments: () => void;
  attachedFiles?: AttachedFile[];
  onExtractFromAttachment?: (attachmentId: string) => void;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onRutChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onSelectType: (id: string, label: string) => void;
  onEntryTimeChange: (value: string) => void;
  onExitTimeChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const InlinePatientDemographics: React.FC<InlinePatientDemographicsProps> = ({
  name,
  rut,
  birthDate,
  gender,
  typeId,
  patientTypes,
  isTurno,
  entryTime,
  exitTime,
  isExtractingFromFiles,
  onExtractFromAttachments,
  attachedFiles,
  onExtractFromAttachment,
  onNameChange,
  onNameBlur,
  onRutChange,
  onBirthDateChange,
  onGenderChange,
  onSelectType,
  onEntryTimeChange,
  onExitTimeChange,
  onSave,
  onClose,
}) => (
  <div className="w-full min-w-0 overflow-hidden">
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
      isExtractingFromFiles={isExtractingFromFiles}
      onExtractFromAttachments={onExtractFromAttachments}
      attachedFiles={attachedFiles}
      onExtractFromAttachment={onExtractFromAttachment}
      onNameChange={onNameChange}
      onNameBlur={onNameBlur}
      onRutChange={onRutChange}
      onBirthDateChange={onBirthDateChange}
      onGenderChange={onGenderChange}
      onSelectType={onSelectType}
      onEntryTimeChange={onEntryTimeChange}
      onExitTimeChange={onExitTimeChange}
      onSave={onSave}
      onClose={onClose}
      defaultExpanded={true}
      minimalist={true}
    />
  </div>
);

export default React.memo(InlinePatientDemographics);
