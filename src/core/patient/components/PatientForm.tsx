import React, { useId, useState } from 'react';
import { Clock, Users, Save, ChevronUp, Sparkles, UserCog } from 'lucide-react';
import { PatientTypeConfig } from '@shared/types';
import { Button } from '@core/ui';

interface PatientFormProps {
  name: string;
  rut: string;
  birthDate: string;
  gender: string;
  typeId: string;
  patientTypes: PatientTypeConfig[];
  isTurno: boolean;
  entryTime: string;
  exitTime: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onRutChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onSelectType: (typeId: string, typeLabel: string) => void;
  onEntryTimeChange: (value: string) => void;
  onExitTimeChange: (value: string) => void;
  compact?: boolean;
  onSave?: () => void;
  onClose?: () => void;
  // Extraction props
  isExtractingFromFiles?: boolean;
  onExtractFromAttachments?: () => void;
  defaultExpanded?: boolean;
  minimalist?: boolean;
  superMinimalist?: boolean;
}

const PatientForm: React.FC<PatientFormProps> = ({
  name,
  rut,
  birthDate,
  gender,
  typeId,
  patientTypes,
  isTurno,
  entryTime,
  exitTime,
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
  isExtractingFromFiles = false,
  onExtractFromAttachments,
  defaultExpanded = false,
  minimalist = false,
  superMinimalist = false,
}) => {
  const nameId = useId();
  const rutId = useId();
  const birthDateId = useId();
  const genderId = useId();
  const entryTimeId = useId();
  const exitTimeId = useId();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded || !name || name.trim() === '');

  const selectedType = patientTypes.find(t => t.id === typeId);

  // --- Collapsed / Summary View ---
  if (!isExpanded && !compact && !minimalist && !superMinimalist && name) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="w-full bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-all cursor-pointer group hover:border-blue-300 hover:shadow-md animate-fade-in"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
              {name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{rut || 'SIN RUT'}</span>
              <span className="h-1 w-1 rounded-full bg-gray-200" />
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase border ${selectedType?.id === 'turno' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {selectedType?.label || 'TIPO'}
              </span>
              {isTurno && (entryTime || exitTime) && (
                <>
                  <span className="h-1 w-1 rounded-full bg-gray-200" />
                  <span className="text-[11px] font-bold text-blue-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entryTime || '--:--'} {exitTime && `> ${exitTime}`}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="p-2 text-gray-300 group-hover:text-blue-500 transition-all">
            <UserCog className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // --- Expanded / Full Form View ---
  const cardClasses = superMinimalist
    ? "space-y-1.5"
    : minimalist
      ? "space-y-3"
      : compact
        ? "space-y-2"
        : "p-3 md:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm space-y-3 animate-slide-up transition-all";

  const typeClasses = superMinimalist
    ? "space-y-1.5 pt-1.5"
    : minimalist
      ? "space-y-3 pt-2"
      : compact
        ? "space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800"
        : "p-3 md:p-4 rounded-2xl border-2 border-blue-50 dark:border-blue-900/10 bg-blue-50/20 dark:bg-blue-900/5 space-y-3 animate-slide-up delay-75 transition-all";

  return (
    <div className={`w-full min-w-0 overflow-hidden ${superMinimalist ? "py-1" : minimalist ? "pt-1 pb-2" : compact ? "space-y-2" : "space-y-3"}`}>
      <div className={cardClasses}>
        {!compact && !minimalist && !superMinimalist && (
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1.5 tracking-[0.15em]">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Datos Principales
            </h3>
            <div className="flex items-center gap-2">
              {onExtractFromAttachments && (
                <button
                  onClick={onExtractFromAttachments}
                  disabled={isExtractingFromFiles}
                  className="text-[9px] inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 font-black hover:bg-blue-100 transition-all disabled:opacity-50 uppercase tracking-tighter"
                >
                  <Sparkles className={`w-3 h-3 ${isExtractingFromFiles ? 'animate-spin' : ''}`} />
                  {isExtractingFromFiles ? 'LECTURA...' : 'IA SCAN'}
                </button>
              )}
              {name && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className={compact || minimalist || superMinimalist ? "space-y-1.5" : "space-y-3"}>
          <div className={superMinimalist ? "flex flex-nowrap items-end gap-1.5" : compact || minimalist ? "flex flex-wrap gap-2" : "grid grid-cols-1 md:grid-cols-4 gap-3"}>
            <div className={superMinimalist ? "flex-[3] min-w-0" : compact || minimalist ? "flex-1 min-w-[200px]" : "md:col-span-2"}>
              <label htmlFor={nameId} className={`${superMinimalist ? 'text-[8px]' : compact || minimalist ? 'text-[9px]' : 'text-[10px]'} block font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wider ml-1`}>
                Nombre Completo
              </label>
              <input
                id={nameId}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={onNameBlur}
                placeholder="Nombre Apellido"
                className={`w-full px-2.5 ${superMinimalist ? 'py-1 text-[11px]' : compact || minimalist ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-400 outline-none transition-all font-bold text-gray-900 dark:text-white`}
              />
            </div>
            <div className={superMinimalist ? "flex-[1.5] min-w-0" : compact || minimalist ? "flex-1 min-w-[120px]" : "md:col-span-1"}>
              <label htmlFor={rutId} className={`${superMinimalist ? 'text-[8px]' : compact || minimalist ? 'text-[9px]' : 'text-[10px]'} block font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wider ml-1`}>
                RUT
              </label>
              <input
                id={rutId}
                value={rut}
                onChange={(e) => onRutChange(e.target.value)}
                placeholder="12.345.678-9"
                className={`w-full px-2.5 ${superMinimalist ? 'py-1 text-[11px]' : compact || minimalist ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-400 outline-none transition-all font-bold text-gray-900 dark:text-white`}
              />
            </div>
            <div className={superMinimalist ? "flex-[1.5] min-w-0 flex gap-1.5" : compact || minimalist ? "flex gap-2 min-w-[140px]" : "md:col-span-1 flex gap-2"}>
              <div className="flex-[2] min-w-0">
                <label htmlFor={birthDateId} className={`${superMinimalist ? 'text-[8px]' : compact || minimalist ? 'text-[9px]' : 'text-[10px]'} block font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wider ml-1 truncate`}>
                  Nacim.
                </label>
                <input
                  type="date"
                  id={birthDateId}
                  value={birthDate}
                  onChange={(e) => onBirthDateChange(e.target.value)}
                  className={`w-full px-1.5 ${superMinimalist ? 'py-1 text-[10px]' : compact || minimalist ? 'py-1.5 text-[11px]' : 'py-2 text-xs'} rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-400 outline-none transition-all font-bold text-gray-900 dark:text-white`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor={genderId} className={`${superMinimalist ? 'text-[8px]' : compact || minimalist ? 'text-[9px]' : 'text-[10px]'} block font-bold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wider ml-1`}>
                  Gén.
                </label>
                <select
                  id={genderId}
                  value={gender}
                  onChange={(e) => onGenderChange(e.target.value)}
                  className={`w-full px-1 ${superMinimalist ? 'py-1 text-[10px]' : compact || minimalist ? 'py-1.5 text-[11px]' : 'py-2 text-xs'} rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-400 outline-none transition-all font-bold text-gray-900 dark:text-white appearance-none text-center`}
                >
                  <option value="">-</option>
                  <option value="Masculino">M</option>
                  <option value="Femenino">F</option>
                  <option value="Otro">O</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={typeClasses}>
        {!compact && !minimalist && !superMinimalist && (
          <h3 className="text-[9px] font-black uppercase text-blue-600/60 mb-1 flex items-center gap-1.5 tracking-[0.2em] ml-1">
            <Clock className="w-3.5 h-3.5" /> Selección de Atención
          </h3>
        )}
        <div className={compact || minimalist || superMinimalist ? "space-y-1.5" : "space-y-3"}>
          <div className="flex flex-wrap items-center gap-2">
            {!compact && (minimalist || superMinimalist) && (
              <span className={`${superMinimalist ? 'text-[7px]' : 'text-[8px]'} font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1`}>Atención:</span>
            )}
            <div className="flex flex-wrap gap-1 flex-1">
              {patientTypes.map((patientType) => (
                <button
                  key={patientType.id}
                  onClick={() => onSelectType(patientType.id, patientType.label)}
                  type="button"
                  aria-pressed={typeId === patientType.id}
                  className={`${superMinimalist ? 'text-[8px] py-1 px-2.5' : 'text-[9px] py-1.5 px-3'} whitespace-nowrap font-black rounded-lg border transition-all flex-1 md:flex-none justify-center uppercase tracking-tight ${typeId === patientType.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-gray-800/10 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700/50 hover:border-blue-300'
                    }`}
                >
                  {patientType.label}
                </button>
              ))}
            </div>

            {(compact || minimalist || superMinimalist) && onSave && (
              <div className="flex gap-1 ml-auto">
                <Button variant="ghost" size="sm" onClick={onClose} className={`${superMinimalist ? 'text-[8px] h-6 px-1.5' : 'text-[9px] h-7 px-2'} font-bold`}>CANCELAR</Button>
                <Button size="sm" onClick={onSave} className={`bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-black ${superMinimalist ? 'text-[8px] h-6 px-2.5' : 'text-[9px] h-7 px-3'}`}>
                  <Save className={`${superMinimalist ? 'w-3 h-3' : 'w-3.5 h-3.5'} mr-1`} /> GUARDAR
                </Button>
              </div>
            )}
          </div>

          {isTurno && (
            <div className={`grid grid-cols-2 gap-3 animate-fade-in pt-2 ${compact || minimalist ? '' : 'border-t border-blue-100/50 dark:border-blue-800/20'}`}>
              <div>
                <label htmlFor={entryTimeId} className="block text-[8px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-[0.2em] ml-1">
                  Hora Ingreso
                </label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="time"
                    id={entryTimeId}
                    value={entryTime}
                    onChange={(e) => onEntryTimeChange(e.target.value)}
                    className={`w-full pl-8 ${compact || minimalist ? 'p-1.5 text-[10px]' : 'p-2 text-[11px]'} rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 dark:text-white transition-all`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor={exitTimeId} className="block text-[8px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-[0.2em] ml-1">
                  Hora Egreso
                </label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="time"
                    id={exitTimeId}
                    value={exitTime}
                    onChange={(e) => onExitTimeChange(e.target.value)}
                    className={`w-full pl-8 ${compact || minimalist ? 'p-1.5 text-[10px]' : 'p-2 text-[11px]'} rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 dark:text-white transition-all`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
