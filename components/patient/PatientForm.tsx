import React, { useId } from 'react';
import { Clock, Users } from 'lucide-react';
import { PatientTypeConfig } from '../../types';

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
}) => {
  const nameId = useId();
  const rutId = useId();
  const birthDateId = useId();
  const genderId = useId();
  const entryTimeId = useId();
  const exitTimeId = useId();

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2 tracking-wider">
          <Users className="w-3.5 h-3.5" /> Datos del Paciente
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor={nameId} className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre Completo
            </label>
            <input
              id={nameId}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={onNameBlur}
              placeholder="Nombre Apellido 1 Apellido 2"
              className="w-full px-3 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor={rutId} className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                RUT
              </label>
              <input
                id={rutId}
                value={rut}
                onChange={(e) => onRutChange(e.target.value)}
                placeholder="12.345.678-9"
                className="w-full px-3 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={birthDateId} className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Nacimiento
                </label>
                <input
                  type="date"
                  id={birthDateId}
                  value={birthDate}
                  onChange={(e) => onBirthDateChange(e.target.value)}
                  className="w-full px-2 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor={genderId} className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Género
                </label>
                <select
                  id={genderId}
                  value={gender}
                  onChange={(e) => onGenderChange(e.target.value)}
                  className="w-full px-2 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
        <h3 className="text-xs font-bold uppercase text-blue-500/80 mb-3 flex items-center gap-2 tracking-wider">
          <Clock className="w-3.5 h-3.5" /> Tipo de Ingreso
        </h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {patientTypes.map((patientType) => (
              <button
                key={patientType.id}
                onClick={() => onSelectType(patientType.id, patientType.label)}
                type="button"
                aria-pressed={typeId === patientType.id}
                aria-label={`Seleccionar tipo ${patientType.label}`}
                className={`text-xs font-medium py-2 px-3 rounded-lg border transition-all flex-1 md:flex-none justify-center ${
                  typeId === patientType.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                {patientType.label}
              </button>
            ))}
          </div>

          {isTurno && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in pt-2 border-t border-blue-100 dark:border-blue-800/30">
              <div>
                <label htmlFor={entryTimeId} className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Hora Ingreso
                </label>
                <input
                  type="time"
                  id={entryTimeId}
                  value={entryTime}
                  onChange={(e) => onEntryTimeChange(e.target.value)}
                  className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs outline-none"
                />
              </div>
              <div>
                <label htmlFor={exitTimeId} className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Hora Egreso
                </label>
                <input
                  type="time"
                  id={exitTimeId}
                  value={exitTime}
                  onChange={(e) => onExitTimeChange(e.target.value)}
                  className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs outline-none"
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
