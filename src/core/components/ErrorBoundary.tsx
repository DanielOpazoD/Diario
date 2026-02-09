import React from 'react';
import { LogContext } from '@core/context/LogContext';
import { logEvent } from '@use-cases/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  static contextType = LogContext;
  declare context: React.ContextType<typeof LogContext>;

  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const contextLogger = this.context?.addLog;

    if (contextLogger) {
      contextLogger('error', 'ErrorBoundary', error.message, { stack: error.stack, componentStack: info.componentStack });
    } else {
      logEvent('error', 'ErrorBoundary', error.message, { stack: error.stack, componentStack: info.componentStack });
    }
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 text-gray-800 p-6">
          <div className="max-w-lg text-center space-y-2">
            <h1 className="text-3xl font-bold">Se produjo un problema</h1>
            <p className="text-gray-600">
              Algo salió mal al cargar la aplicación. Puedes intentar recuperar la sesión o recargar la página.
            </p>
            {this.state.error?.message && (
              <p className="text-sm text-gray-500">Detalle: {this.state.error.message}</p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={this.handleRecover}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Reintentar
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
