import React from 'react';
import useFirebaseSync from './hooks/useFirebaseSync';
import AppProviders from './app/providers/AppProviders';
import AppShell from './app/shell/AppShell';

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
