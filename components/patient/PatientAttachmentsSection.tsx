import React from 'react';
import FileAttachmentManager from '../FileAttachmentManager';
import { AttachedFile } from '../../types';

interface PatientAttachmentsSectionProps {
  attachedFiles: AttachedFile[];
  patientId: string;
  patientRut: string;
  patientName: string;
  driveFolderId: string | null;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onFilesChange: (files: AttachedFile[]) => void;
  onDriveFolderIdChange: (folderId: string | null) => void;
}

const PatientAttachmentsSection: React.FC<PatientAttachmentsSectionProps> = ({
  attachedFiles,
  patientId,
  patientRut,
  patientName,
  driveFolderId,
  addToast,
  onFilesChange,
  onDriveFolderIdChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 md:dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 flex flex-col min-h-[200px]">
      <FileAttachmentManager
        files={attachedFiles}
        patientId={patientId}
        patientRut={patientRut}
        patientName={patientName}
        patientDriveFolderId={driveFolderId}
        onFilesChange={onFilesChange}
        onDriveFolderIdChange={onDriveFolderIdChange}
        addToast={addToast}
      />
    </div>
  );
};

export default PatientAttachmentsSection;
