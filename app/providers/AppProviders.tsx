import React from 'react';
import { QueryProvider } from '../../providers/QueryProvider';
import { LogProvider } from '../../context/LogContext';
import ErrorBoundary from '../../components/ErrorBoundary';

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
