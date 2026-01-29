import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';

import AppearanceSettings from '@features/settings/AppearanceSettings';
import ViewPreferencesSettings from '@features/settings/ViewPreferencesSettings';
import SecuritySettings from '@features/settings/SecuritySettings';
import PatientTypesSettings from '@features/settings/PatientTypesSettings';
import StorageSettings from '@features/settings/StorageSettings';

const Settings: React.FC = () => {
  const {
    theme,
    toggleTheme,
    patientTypes,
    addPatientType,
    removePatientType,
    setPatientTypes,
    records,
    setRecords,
    addToast,
    securityPin,
    autoLockMinutes,
    setSecurityPin,
    setAutoLockMinutes,
    highlightPendingPatients,
    setHighlightPendingPatients,
    compactStats,
    setCompactStats,
  } = useAppStore(useShallow(state => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    patientTypes: state.patientTypes,
    addPatientType: state.addPatientType,
    removePatientType: state.removePatientType,
    setPatientTypes: state.setPatientTypes,
    records: state.records,
    setRecords: state.setRecords,
    addToast: state.addToast,
    securityPin: state.securityPin,
    autoLockMinutes: state.autoLockMinutes,
    setSecurityPin: state.setSecurityPin,
    setAutoLockMinutes: state.setAutoLockMinutes,
    highlightPendingPatients: state.highlightPendingPatients,
    setHighlightPendingPatients: state.setHighlightPendingPatients,
    compactStats: state.compactStats,
    setCompactStats: state.setCompactStats,
  })));

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in pt-2">
      <div className="flex items-center gap-3 mb-6 md:mb-8 px-2">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <SettingsIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Configuración
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Personaliza tu experiencia en MediDiario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppearanceSettings theme={theme} onToggleTheme={toggleTheme} />

        <ViewPreferencesSettings
          highlightPendingPatients={highlightPendingPatients}
          onSetHighlightPendingPatients={setHighlightPendingPatients}
          compactStats={compactStats}
          onSetCompactStats={setCompactStats}
        />

        <SecuritySettings
          securityPin={securityPin}
          autoLockMinutes={autoLockMinutes}
          onSetSecurityPin={setSecurityPin}
          onSetAutoLockMinutes={setAutoLockMinutes}
          addToast={addToast}
        />

        <PatientTypesSettings
          patientTypes={patientTypes}
          records={records}
          onAddPatientType={addPatientType}
          onRemovePatientType={removePatientType}
          onSetPatientTypes={setPatientTypes}
          onSetRecords={setRecords}
          addToast={addToast}
        />

        <StorageSettings addToast={addToast} />
      </div>
    </div>
  );
};

export default Settings;
