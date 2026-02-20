import React from 'react';
import AppProviders from '@core/app/providers/AppProviders';
import AppShell from '@core/app/shell/AppShell';
import { initPersistence } from '@core/app/persistence';

const App: React.FC = () => {
  React.useEffect(() => {
    // Initialize persistence (LocalStorage + Firebase sync)
    const unsubscribe = initPersistence();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
};

export default App;
