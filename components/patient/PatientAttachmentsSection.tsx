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
    <div className="bg-white/95 dark:bg-gray-800/90 p-4 md:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-blue-50/40 dark:shadow-none flex-1 flex flex-col min-h-[220px] gap-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Adjuntos</p>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Archivos del paciente</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sincroniza con Drive, marca favoritos y describe cada documento.</p>
        </div>
        <span className="px-3 py-1 text-[11px] rounded-full bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800">Drive Ready</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/50 p-2">
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
  );
};

export default PatientAttachmentsSection;
