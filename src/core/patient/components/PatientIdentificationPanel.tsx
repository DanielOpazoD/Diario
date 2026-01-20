import React from 'react';
import { Sparkles, Users } from 'lucide-react';
import PatientForm from './PatientForm';
import { PatientTypeConfig } from '@shared/types';

interface PatientIdentificationPanelProps {
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
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onRutChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onSelectType: (typeIdValue: string, typeLabel: string) => void;
  onEntryTimeChange: (value: string) => void;
  onExitTimeChange: (value: string) => void;
  compact?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}

const PatientIdentificationPanel: React.FC<PatientIdentificationPanelProps> = ({
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
  onNameChange,
  onNameBlur,
  onRutChange,
  onBirthDateChange,
  onGenderChange,
  onSelectType,
  onEntryTimeChange,
  onExitTimeChange,
  compact = false,
  onSave,
  onClose,
}) => {
  return (
    <div className={`w-full min-w-0 overflow-hidden ${compact ? 'space-y-2' : 'md:col-span-4 space-y-5'}`}>
      {!compact && (
        <div className="bg-white dark:bg-gray-800 md:dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2 tracking-wider">
            <Users className="w-3.5 h-3.5" /> Identificación
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={onExtractFromAttachments}
              disabled={isExtractingFromFiles}
              className="text-[11px] inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isExtractingFromFiles ? 'animate-spin' : ''}`} />
              {isExtractingFromFiles ? 'Leyendo adjuntos...' : 'Completar con adjuntos'}
            </button>
          </div>
        </div>
      )}

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
        compact={compact}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );
};

export default PatientIdentificationPanel;
