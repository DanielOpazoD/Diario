import React from 'react';
import FileAttachmentManager from '@features/files/FileAttachmentManager';
import { AttachedFile } from '@shared/types';
import { useOptionalPatientModalContext } from '@core/patient/context/PatientModalContext';

interface PatientAttachmentsSectionProps {
  compact?: boolean;
  attachedFiles?: AttachedFile[];
  patientId?: string;
  patientRut?: string;
  patientName?: string;
  driveFolderId?: string | null;
  addToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
  onFilesChange?: (files: AttachedFile[]) => void;
  onDriveFolderIdChange?: (id: string | null) => void;
}

const PatientAttachmentsSection: React.FC<PatientAttachmentsSectionProps> = (props) => {
  const context = useOptionalPatientModalContext();

  const attachedFiles = props.attachedFiles ?? context?.attachedFiles ?? [];
  const patientId = props.patientId ?? context?.patientId ?? '';
  const patientRut = props.patientRut ?? context?.rut ?? '';
  const patientName = props.patientName ?? context?.name ?? '';
  const patientDriveFolderId = props.driveFolderId ?? context?.driveFolderId ?? null;
  const onFilesChange = props.onFilesChange ?? context?.setAttachedFiles ?? (() => { });
  const onDriveFolderIdChange = props.onDriveFolderIdChange ?? context?.setDriveFolderId ?? (() => { });
  const addToast = props.addToast ?? context?.addToast ?? (() => { });

  const { compact = false } = props;

  // We still need addToast from somewhere, but wait, addToast is passed to Provider
  // I should probably expose addToast in the context if it's not already there.
  // Looking at my previous write_to_file... I didn't include addToast in value.

  // Actually, useAppStore has addToast? No, it's usually passed from DailyView.
  // I will add addToast to the context value.


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
        patientDriveFolderId={patientDriveFolderId}
        onFilesChange={onFilesChange}
        onDriveFolderIdChange={onDriveFolderIdChange}
        addToast={addToast}
        compact={compact}
      />
    </div>
  );
};

export default React.memo(PatientAttachmentsSection);
