import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { LogContext } from '../context/LogContext';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  resetKey: number;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  static contextType = LogContext;
  declare context: React.ContextType<typeof LogContext>;

  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, resetKey: Date.now() };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    if (this.context?.addLog) {
      this.context.addLog({
        level: 'error',
        source: 'ErrorBoundary',
        message: error.message,
        error,
        context: { componentStack: errorInfo.componentStack },
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, resetKey: Date.now() });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-red-300/80 font-semibold">Algo salió mal</p>
                <h1 className="text-2xl font-bold">Se produjo un error inesperado</h1>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed">
              La aplicación encontró un problema y se detuvo. Puedes intentar recuperarte sin perder contexto o recargar la página para empezar de nuevo.
            </p>

            <div className="bg-black/30 border border-gray-800 rounded-lg p-3 text-sm text-gray-300">
              <p className="font-semibold text-gray-100">Detalle técnico</p>
              <p className="mt-1 text-red-200/90">{this.state.error?.message}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-400 max-h-40 overflow-auto">
                  {this.state.errorInfo.componentStack.trim()}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Reintentar
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700"
              >
                <RotateCcw className="w-4 h-4" /> Recargar aplicación
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default ErrorBoundary;
