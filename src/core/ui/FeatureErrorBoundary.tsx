import React from 'react';
import { logEvent } from '@use-cases/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FeatureErrorBoundaryProps {
    featureName: string;
    children: React.ReactNode;
}

interface FeatureErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * Lightweight error boundary for individual feature modules.
 * When a feature crashes, only that feature shows an error — the
 * rest of the app (navbar, other features) keeps working.
 */
class FeatureErrorBoundary extends React.Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
    constructor(props: FeatureErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        logEvent('error', `FeatureErrorBoundary:${this.props.featureName}`, error.message, {
            stack: error.stack,
            componentStack: info.componentStack,
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            Error en {this.props.featureName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                            Esta sección tuvo un problema, pero el resto de la aplicación sigue funcionando.
                        </p>
                        {this.state.error?.message && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {this.state.error.message}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default FeatureErrorBoundary;
