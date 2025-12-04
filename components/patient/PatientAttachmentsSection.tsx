import React from 'react';
import FileAttachmentManager from '../FileAttachmentManager';
import { AttachedFile } from '../../types';

interface PatientAttachmentsSectionProps {
  attachedFiles: AttachedFile[];
  patientRut: string;
  patientName: string;
  driveFolderId: string | null;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onFilesChange: (files: AttachedFile[]) => void;
  onDriveFolderIdChange: (folderId: string | null) => void;
}

const PatientAttachmentsSection: React.FC<PatientAttachmentsSectionProps> = ({
  attachedFiles,
  patientRut,
  patientName,
  driveFolderId,
  addToast,
  onFilesChange,
  onDriveFolderIdChange,
}) => {
  return (
    <div className="h-full">
      <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-4 md:p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Archivos del paciente</p>
            <p className="text-xs text-gray-500 dark:text-gray-300">Organiza estudios, epicrisis y cualquier adjunto en un solo lugar.</p>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100 border border-blue-100 dark:border-blue-800">
            Drive listo
          </span>
        </div>

        <div className="flex-1 min-h-[240px] rounded-xl border border-dashed border-gray-200 dark:border-gray-700/70 bg-gray-50/80 dark:bg-gray-800/60 p-2 md:p-3">
          <FileAttachmentManager
            files={attachedFiles}
            patientRut={patientRut}
            patientName={patientName}
            patientDriveFolderId={driveFolderId}
            onFilesChange={onFilesChange}
            onDriveFolderIdChange={onDriveFolderIdChange}
            addToast={addToast}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientAttachmentsSection;
