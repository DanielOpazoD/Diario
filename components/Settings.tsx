
import React, { useState } from 'react';
import { Moon, Sun, Plus, Trash2, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import Button from './Button';
import { PatientTypeConfig } from '../types';

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

const Settings: React.FC = () => {
  const theme = useAppStore(state => state.theme);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  const patientTypes = useAppStore(state => state.patientTypes);
  const addPatientType = useAppStore(state => state.addPatientType);
  const removePatientType = useAppStore(state => state.removePatientType);
  const addToast = useAppStore(state => state.addToast);
  const enableSecurity = useAppStore(state => state.enableSecurity);
  const securityEnabled = useAppStore(state => state.securityEnabled);

  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [isSecuring, setIsSecuring] = useState(false);

  const handleAddType = () => {
    if (!newTypeLabel.trim()) {
      addToast('error', 'El nombre es requerido');
      return;
    }
    if (patientTypes.some(t => t.label.toLowerCase() === newTypeLabel.toLowerCase())) {
      addToast('error', 'Ya existe un tipo con este nombre');
      return;
    }

    const newType: PatientTypeConfig = {
      id: crypto.randomUUID(),
      label: newTypeLabel.trim(),
      colorClass: selectedColor
    };
    addPatientType(newType);
    setNewTypeLabel('');
    addToast('success', 'Tipo de ingreso agregado');
  };

  const handleConfigurePin = async () => {
    const pin = window.prompt('Configura un PIN (mínimo 4 dígitos):');
    if (!pin || pin.length < 4) {
      addToast('error', 'PIN inválido. Debe tener al menos 4 caracteres.');
      return;
    }

    try {
      setIsSecuring(true);
      await enableSecurity(pin);
      addToast('success', 'Capa de seguridad activada y datos cifrados.');
    } catch (error) {
      console.error(error);
      addToast('error', 'No se pudo activar la seguridad. Intenta nuevamente.');
    } finally {
      setIsSecuring(false);
    }
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

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Seguridad</h3>
          <p className="text-xs text-gray-500 mb-4">Protege tus registros con cifrado AES-GCM derivado de tu PIN.</p>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${securityEnabled ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/80'}`}>
                <ShieldCheck className={`w-5 h-5 ${securityEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-300'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Cifrado Local</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {securityEnabled ? 'Activo: los registros se guardan cifrados.' : 'Inactivo: los registros se guardan en texto plano.'}
                </p>
              </div>
            </div>
            <Button onClick={handleConfigurePin} disabled={isSecuring} size="sm">
              {isSecuring ? 'Guardando...' : securityEnabled ? 'Actualizar PIN' : 'Configurar PIN'}
            </Button>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            El cifrado es opcional y mantiene compatibilidad con respaldos antiguos en texto plano. Si pierdes el PIN, deberás restaurar un respaldo sin cifrar.
          </p>
        </div>

        {/* Patient Types Config */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tipos de Ingreso</h3>
           <p className="text-xs text-gray-500 mb-4">Define las categorías para clasificar a tus pacientes.</p>
           
           <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {patientTypes.map(type => (
                 <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${type.colorClass}`}>
                          {type.label}
                       </span>
                       {type.label === 'Turno' && <span className="text-[10px] text-gray-400">(Hora activa)</span>}
                    </div>
                    {!type.isDefault && (
                       <button 
                         onClick={() => removePatientType(type.id)}
                         className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    )}
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
