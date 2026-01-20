import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import useAppStore from '@core/stores/useAppStore';

import AppearanceSettings from '@features/settings/AppearanceSettings';
import ViewPreferencesSettings from '@features/settings/ViewPreferencesSettings';
import SecuritySettings from '@features/settings/SecuritySettings';
import PatientTypesSettings from '@features/settings/PatientTypesSettings';

const Settings: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const patientTypes = useAppStore((state) => state.patientTypes);
  const addPatientType = useAppStore((state) => state.addPatientType);
  const removePatientType = useAppStore((state) => state.removePatientType);
  const setPatientTypes = useAppStore((state) => state.setPatientTypes);
  const records = useAppStore((state) => state.records);
  const setRecords = useAppStore((state) => state.setRecords);
  const addToast = useAppStore((state) => state.addToast);
  const securityPin = useAppStore((state) => state.securityPin);
  const autoLockMinutes = useAppStore((state) => state.autoLockMinutes);
  const setSecurityPin = useAppStore((state) => state.setSecurityPin);
  const setAutoLockMinutes = useAppStore((state) => state.setAutoLockMinutes);
  const highlightPendingPatients = useAppStore((state) => state.highlightPendingPatients);
  const setHighlightPendingPatients = useAppStore((state) => state.setHighlightPendingPatients);
  const compactStats = useAppStore((state) => state.compactStats);
  const setCompactStats = useAppStore((state) => state.setCompactStats);

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
      </div>
    </div>
  );
};

export default Settings;
