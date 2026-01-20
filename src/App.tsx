import React from 'react';
import useFirebaseSync from '@core/hooks/useFirebaseSync';
import AppProviders from '@core/app/providers/AppProviders';
import AppShell from '@core/app/shell/AppShell';
import { initPersistence } from '@services/persistenceService';

// Initialize persistence (LocalStorage + Firebase sync)
initPersistence();

const App: React.FC = () => {
  // Sync Patients from Firebase
  useFirebaseSync();

  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
};

export default App;
