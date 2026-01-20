import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos de pacientes se consideran "frescos" por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Mantener datos en caché por 30 minutos incluso si el componente se desmonta
      gcTime: 30 * 60 * 1000,
      // No refetch automático en focus de ventana para evitar requests innecesarios
      refetchOnWindowFocus: false,
      // Reintentar una vez en caso de error
      retry: 1,
      // Usar datos en caché mientras se revalida en background
      refetchOnMount: 'always',
    },
  },
});

export const getQueryClient = () => queryClient;

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
