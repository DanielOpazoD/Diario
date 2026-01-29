import React from 'react';
import { AttachedFile } from '@shared/types';
import PatientAttachmentsSection from '@core/patient/components/PatientAttachmentsSection';

interface InlinePatientFilesProps {
  attachedFiles: AttachedFile[];
  patientId: string;
  patientRut: string;
  patientName: string;
  driveFolderId: string | null;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onFilesChange: (files: AttachedFile[]) => void;
  onDriveFolderIdChange: (id: string | null) => void;
}

const InlinePatientFiles: React.FC<InlinePatientFilesProps> = ({
  attachedFiles,
  patientId,
  patientRut,
  patientName,
  driveFolderId,
  addToast,
  onFilesChange,
  onDriveFolderIdChange,
}) => (
  <div className="w-full min-w-0 overflow-hidden animate-fade-in">
    <PatientAttachmentsSection
      attachedFiles={attachedFiles}
      patientId={patientId}
      patientRut={patientRut}
      patientName={patientName}
      driveFolderId={driveFolderId}
      addToast={addToast}
      onFilesChange={onFilesChange}
      onDriveFolderIdChange={onDriveFolderIdChange}
      compact={true}
    />
  </div>
);

export default InlinePatientFiles;
