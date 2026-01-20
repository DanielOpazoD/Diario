import React from 'react';
import { QueryProvider } from '@core/providers/QueryProvider';
import { LogProvider } from '@core/context/LogContext';
import ErrorBoundary from '@core/components/ErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <QueryProvider>
    <LogProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </LogProvider>
  </QueryProvider>
);

export default AppProviders;
