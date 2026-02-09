import React from 'react';
import FileAttachmentManager from '@features/files/FileAttachmentManager';
import { AttachedFile } from '@shared/types';

interface PatientAttachmentsSectionProps {
  attachedFiles: AttachedFile[];
  patientId: string;
  patientRut: string;
  patientName: string;
  driveFolderId: string | null;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onFilesChange: (files: AttachedFile[]) => void;
  onDriveFolderIdChange: (folderId: string | null) => void;
  compact?: boolean;
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
  compact = false,
}) => {
  const baseClasses = "flex-1 flex flex-col w-full";
  const compactClasses = "bg-transparent";
  const defaultClasses = "bg-white dark:bg-gray-800 md:dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm min-h-[200px]";

  return (
    <div className={`${baseClasses} ${compact ? compactClasses : defaultClasses}`}>
      <FileAttachmentManager
        files={attachedFiles}
        patientId={patientId}
        patientRut={patientRut}
        patientName={patientName}
        patientDriveFolderId={driveFolderId}
        onFilesChange={onFilesChange}
        onDriveFolderIdChange={onDriveFolderIdChange}
        addToast={addToast}
        compact={compact}
      />
    </div>
  );
};

export default React.memo(PatientAttachmentsSection);
