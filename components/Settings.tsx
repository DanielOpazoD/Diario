
import React, { useEffect, useState } from 'react';
import { Moon, Sun, Plus, Trash2, Settings as SettingsIcon, Lock, Timer, Pencil, Check, X } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import Button from './Button';
import { PatientTypeConfig } from '../shared/types/index.ts';

const AVAILABLE_COLORS = [
  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
];

const AUTO_LOCK_OPTIONS = [0, 1, 3, 5, 10, 15, 30];

export const validateTypeLabel = (
  label: string,
  patientTypes: PatientTypeConfig[],
  excludeId?: string,
) => {
  const trimmed = label.trim();
  if (!trimmed) return 'El nombre es requerido';

  const duplicate = patientTypes.some(
    (t) => t.id !== excludeId && t.label.toLowerCase() === trimmed.toLowerCase()
  );

  if (duplicate) return 'Ya existe un tipo con este nombre';

  return null;
};

const Settings: React.FC = () => {
  const theme = useAppStore(state => state.theme);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  const patientTypes = useAppStore(state => state.patientTypes);
  const addPatientType = useAppStore(state => state.addPatientType);
  const removePatientType = useAppStore(state => state.removePatientType);
  const setPatientTypes = useAppStore(state => state.setPatientTypes);
  const records = useAppStore(state => state.records);
  const setRecords = useAppStore(state => state.setRecords);
  const addToast = useAppStore(state => state.addToast);
  const securityPin = useAppStore(state => state.securityPin);
  const autoLockMinutes = useAppStore(state => state.autoLockMinutes);
  const setSecurityPin = useAppStore(state => state.setSecurityPin);
  const setAutoLockMinutes = useAppStore(state => state.setAutoLockMinutes);
  const highlightPendingPatients = useAppStore(state => state.highlightPendingPatients);
  const setHighlightPendingPatients = useAppStore(state => state.setHighlightPendingPatients);
  const compactStats = useAppStore(state => state.compactStats);
  const setCompactStats = useAppStore(state => state.setCompactStats);

  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [lockMinutes, setLockMinutes] = useState(autoLockMinutes);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editedLabel, setEditedLabel] = useState('');

  useEffect(() => {
    setLockMinutes(autoLockMinutes);
  }, [autoLockMinutes]);

  const handleAddType = () => {
    const error = validateTypeLabel(newTypeLabel, patientTypes);
    if (error) return addToast('error', error);

    const newType: PatientTypeConfig = {
      id: crypto.randomUUID(),
      label: newTypeLabel.trim(),
      colorClass: selectedColor
    };
    addPatientType(newType);
    setNewTypeLabel('');
    addToast('success', 'Tipo de ingreso agregado');
  };

  const handleEditType = (type: PatientTypeConfig) => {
    setEditingTypeId(type.id);
    setEditedLabel(type.label);
  };

  const handleSaveType = (type: PatientTypeConfig) => {
    const trimmedLabel = editedLabel.trim();
    const error = validateTypeLabel(trimmedLabel, patientTypes, type.id);
    if (error) return addToast('error', error);

    const updatedTypes = patientTypes.map(t =>
      t.id === type.id ? { ...t, label: trimmedLabel } : t
    );

    const updatedRecords = records.map(record =>
      record.type.toLowerCase() === type.label.toLowerCase()
        ? { ...record, type: trimmedLabel }
        : record
    );

    setPatientTypes(updatedTypes);
    setRecords(updatedRecords);
    setEditingTypeId(null);
    setEditedLabel('');
    addToast('success', 'Nombre de tipo actualizado');
  };

  const handleCancelEdit = () => {
    setEditingTypeId(null);
    setEditedLabel('');
  };

  const handleSavePin = () => {
    if (newPin.length < 4) {
      addToast('error', 'El PIN debe tener al menos 4 dígitos');
      return;
    }

    if (newPin !== confirmPin) {
      addToast('error', 'Los PIN ingresados no coinciden');
      return;
    }

    setSecurityPin(newPin);
    setNewPin('');
    setConfirmPin('');
    addToast('success', 'PIN de bloqueo actualizado');
  };

  const handleRemovePin = () => {
    setSecurityPin(null);
    setNewPin('');
    setConfirmPin('');
    addToast('info', 'Bloqueo con PIN desactivado');
  };

  const handleAutoLockChange = (minutes: number) => {
    setLockMinutes(minutes);
    setAutoLockMinutes(minutes);
    addToast('info', minutes > 0 ? 'Tiempo de bloqueo actualizado' : 'Bloqueo automático desactivado');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in pt-2">
      <div className="flex items-center gap-3 mb-6 md:mb-8 px-2">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <SettingsIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </div>
        <div>
           <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Configuración</h2>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Personaliza tu experiencia en MediDiario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Apariencia</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <div>
                   <p className="font-medium text-gray-900 dark:text-white">Modo Oscuro</p>
                   <p className="text-xs text-gray-500">Alternar entre tema claro y oscuro</p>
                </div>
             </div>
             <button
               onClick={toggleTheme}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'}`}
             >
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </div>

        {/* General Preferences */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Preferencias de vista</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Ajusta densidad y resaltes para la agenda y estadísticas.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Resaltar pendientes</p>
                <p className="text-xs text-gray-500">Enmarca pacientes con tareas abiertas.</p>
              </div>
              <button
                onClick={() => setHighlightPendingPatients(!highlightPendingPatients)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${highlightPendingPatients ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                aria-pressed={highlightPendingPatients}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${highlightPendingPatients ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Estadísticas compactas</p>
                <p className="text-xs text-gray-500">Reduce tipografía y espacios en paneles.</p>
              </div>
              <button
                onClick={() => setCompactStats(!compactStats)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${compactStats ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                aria-pressed={compactStats}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compactStats ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 col-span-1 md:col-span-2">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                <Lock className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Seguridad y Bloqueo</h3>
                <p className="text-xs text-gray-500">Configura el PIN y el tiempo de bloqueo automático.</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border ${securityPin ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/50' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/50'}`}>
              <Lock className="w-4 h-4" />
              {securityPin ? 'PIN activo' : 'PIN desactivado'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nuevo PIN</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Mínimo 4 dígitos"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirmar PIN</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="Repite tu PIN"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleSavePin}
                  disabled={!newPin || !confirmPin}
                  icon={<Lock className="w-4 h-4" />}
                  size="sm"
                >
                  Guardar PIN
                </Button>
                {securityPin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRemovePin}
                    icon={<Trash2 className="w-4 h-4" />}
                  >
                    Quitar PIN
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tiempo de bloqueo</label>
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-200">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <select
                    value={lockMinutes}
                    onChange={(e) => handleAutoLockChange(Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    {AUTO_LOCK_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt === 0 ? 'Nunca (desactivado)' : `${opt} ${opt === 1 ? 'minuto' : 'minutos'}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    El bloqueo automático requiere tener un PIN activo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Types Config */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tipos de Ingreso</h3>
           <p className="text-xs text-gray-500 mb-4">Define las categorías para clasificar a tus pacientes.</p>
           
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                 {patientTypes.map(type => (
                    <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 flex-1">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${type.colorClass}`}>
                          {editingTypeId === type.id ? editedLabel || type.label : type.label}
                       </span>
                       {type.id === 'turno' && <span className="text-[10px] text-gray-400">(Hora activa)</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingTypeId === type.id ? (
                        <>
                          <input
                            value={editedLabel}
                            onChange={e => setEditedLabel(e.target.value)}
                            className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <button
                            onClick={() => handleSaveType(type)}
                            className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            aria-label="Guardar nombre"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/40 rounded-lg transition-colors"
                            aria-label="Cancelar edición"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditType(type)}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            aria-label="Editar nombre"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!type.isDefault && (
                            <button
                              onClick={() => removePatientType(type.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              aria-label="Eliminar tipo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                 </div>
              ))}
           </div>

           <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nuevo Tipo</label>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                 <input 
                   type="text" 
                   value={newTypeLabel}
                   onChange={e => setNewTypeLabel(e.target.value)}
                   placeholder="Nombre (ej. Domicilio)"
                   className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 <Button onClick={handleAddType} disabled={!newTypeLabel} size="sm" icon={<Plus className="w-4 h-4" />}>Agregar</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                 {AVAILABLE_COLORS.map((color, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 md:w-6 md:h-6 rounded-full border-2 transition-all ${color.split(' ')[0]} ${selectedColor === color ? 'border-gray-500 scale-110 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent'}`}
                    />
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
