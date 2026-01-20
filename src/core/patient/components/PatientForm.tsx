import React, { useId } from 'react';
import { Clock, Users, Save } from 'lucide-react';
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
}) => {
  const nameId = useId();
  const rutId = useId();
  const birthDateId = useId();
  const genderId = useId();
  const entryTimeId = useId();
  const exitTimeId = useId();

  const cardClasses = compact
    ? "space-y-2"
    : "p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm space-y-4";

  const typeClasses = compact
    ? "space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800"
    : "p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 space-y-3";

  return (
    <div className={`w-full min-w-0 overflow-hidden ${compact ? "space-y-3" : "space-y-6"}`}>
      <div className={cardClasses}>
        {!compact && (
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2 tracking-wider">
            <Users className="w-3.5 h-3.5" /> Datos del Paciente
          </h3>
        )}
        <div className={compact ? "space-y-2" : "space-y-4"}>
          <div className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-1 md:grid-cols-4 gap-3"}>
            <div className={compact ? "flex-1 min-w-[180px]" : "md:col-span-2"}>
              <label htmlFor={nameId} className={`${compact ? 'text-[10px]' : 'text-xs'} block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between`}>
                Nombre Completo
              </label>
              <input
                id={nameId}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={onNameBlur}
                placeholder="Nombre Apellido 1 Apellido 2"
                className={`w-full px-3 ${compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium`}
              />
            </div>
            <div className={compact ? "flex-1 min-w-[100px]" : "md:col-span-1"}>
              <label htmlFor={rutId} className={`${compact ? 'text-[10px]' : 'text-xs'} block font-bold text-gray-700 dark:text-gray-300 mb-1`}>
                RUT
              </label>
              <input
                id={rutId}
                value={rut}
                onChange={(e) => onRutChange(e.target.value)}
                placeholder="12.345.678-9"
                className={`w-full px-3 ${compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium`}
              />
            </div>
            <div className={compact ? "flex gap-2" : "md:col-span-1 flex gap-2"}>
              <div className="flex-1">
                <label htmlFor={birthDateId} className={`${compact ? 'text-[10px]' : 'text-xs'} block font-bold text-gray-700 dark:text-gray-300 mb-1 truncate`}>
                  Nacim.
                </label>
                <input
                  type="date"
                  id={birthDateId}
                  value={birthDate}
                  onChange={(e) => onBirthDateChange(e.target.value)}
                  className={`w-full px-2 ${compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium`}
                />
              </div>
              <div className="flex-1">
                <label htmlFor={genderId} className={`${compact ? 'text-[10px]' : 'text-xs'} block font-bold text-gray-700 dark:text-gray-300 mb-1`}>
                  Gén.
                </label>
                <select
                  id={genderId}
                  value={gender}
                  onChange={(e) => onGenderChange(e.target.value)}
                  className={`w-full px-2 ${compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium`}
                >
                  <option value="">Sex</option>
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
        {!compact && (
          <h3 className="text-xs font-bold uppercase text-blue-500/80 mb-3 flex items-center gap-2 tracking-wider">
            <Clock className="w-3.5 h-3.5" /> Tipo de Ingreso
          </h3>
        )}
        <div className={compact ? "space-y-2" : "space-y-4"}>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex flex-wrap gap-1 flex-1">
              {patientTypes.map((patientType) => (
                <button
                  key={patientType.id}
                  onClick={() => onSelectType(patientType.id, patientType.label)}
                  type="button"
                  aria-pressed={typeId === patientType.id}
                  aria-label={`Seleccionar tipo ${patientType.label}`}
                  className={`text-[10px] whitespace-nowrap font-bold py-1.5 px-2 rounded-lg border transition-all flex-1 md:flex-none justify-center ${typeId === patientType.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                >
                  {patientType.label}
                </button>
              ))}
            </div>

            {compact && onSave && (
              <div className="flex gap-1.5 ml-auto">
                <Button variant="ghost" size="sm" onClick={onClose} className="text-[10px] h-7 px-2">Cancelar</Button>
                <Button size="sm" onClick={onSave} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold text-[10px] h-7 px-3">
                  <Save className="w-3 h-3 mr-1" /> Guardar
                </Button>
              </div>
            )}
          </div>

          {isTurno && (
            <div className={`grid grid-cols-2 gap-3 animate-fade-in pt-2 ${compact ? '' : 'border-t border-blue-100 dark:border-blue-800/30'}`}>
              <div>
                <label htmlFor={entryTimeId} className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  Ingreso
                </label>
                <input
                  type="time"
                  id={entryTimeId}
                  value={entryTime}
                  onChange={(e) => onEntryTimeChange(e.target.value)}
                  className={`w-full ${compact ? 'p-1.5 text-[11px]' : 'p-2.5 text-xs'} rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium`}
                />
              </div>
              <div>
                <label htmlFor={exitTimeId} className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  Egreso
                </label>
                <input
                  type="time"
                  id={exitTimeId}
                  value={exitTime}
                  onChange={(e) => onExitTimeChange(e.target.value)}
                  className={`w-full ${compact ? 'p-1.5 text-[11px]' : 'p-2.5 text-xs'} rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
